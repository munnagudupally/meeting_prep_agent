const { db, FieldValue } = require('../config/firebase');
const hindsightService = require('../services/hindsightService');

const MEMORIES_COLLECTION = 'memories';

/**
 * List memories for authenticated user
 */
async function listMemories(req, res, next) {
  try {
    const { uid } = req.user;
    const { attendeeEmail, category, limit = 100 } = req.query;

    let query = db.collection(MEMORIES_COLLECTION).where('userId', '==', uid);

    if (attendeeEmail) {
      query = query.where('attendeeEmail', '==', attendeeEmail.toLowerCase().trim());
    }

    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.limit(parseInt(limit, 10)).get();
    const memories = [];

    snapshot.forEach(doc => {
      memories.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt descending
    memories.sort((a, b) => {
      const timeA = a.createdAt ? (a.createdAt.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()) : 0;
      const timeB = b.createdAt ? (b.createdAt.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()) : 0;
      return timeB - timeA;
    });

    return res.status(200).json({
      success: true,
      count: memories.length,
      memories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new memory
 */
async function createMemory(req, res, next) {
  try {
    const { uid } = req.user;
    const {
      attendeeEmail = '',
      attendeeName = '',
      meetingId = '',
      category = 'rapport',
      note,
      sentiment = 'neutral',
      tags = []
    } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Memory note is required'
      });
    }

    const memoryData = {
      userId: uid,
      attendeeEmail: attendeeEmail.toLowerCase().trim(),
      attendeeName: attendeeName.trim(),
      meetingId: meetingId.trim(),
      category: category.trim(),
      note: note.trim(),
      sentiment: ['positive', 'neutral', 'cautious'].includes(sentiment) ? sentiment : 'neutral',
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()) : [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(MEMORIES_COLLECTION).add(memoryData);
    const createdDoc = await docRef.get();

    // Asynchronously retain in Hindsight Cloud
    const hindsightContent = `[${category.toUpperCase()}] ${attendeeName ? `${attendeeName}: ` : ''}${note}`;
    hindsightService.retainMemory(hindsightContent, {
      memoryId: docRef.id,
      meetingId,
      userId: uid,
      attendeeEmail,
      attendeeName,
      category,
      sentiment
    }, [category, attendeeName, attendeeEmail].filter(Boolean)).catch(err => {
      console.warn('[Hindsight] Async memory retention failed (non-blocking):', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Memory saved successfully',
      memory: { id: docRef.id, ...createdDoc.data() }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a memory
 */
async function deleteMemory(req, res, next) {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const docRef = db.collection(MEMORIES_COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    if (doc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this memory'
      });
    }

    await docRef.delete();

    return res.status(200).json({
      success: true,
      message: 'Memory deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listMemories,
  createMemory,
  deleteMemory
};
