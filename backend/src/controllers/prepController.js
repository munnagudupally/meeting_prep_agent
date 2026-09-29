const { db, FieldValue } = require('../config/firebase');
const { generateBrief } = require('../services/prepService');

const MEETINGS_COLLECTION = 'meetings';
const PREP_BRIEFS_COLLECTION = 'prep_briefs';
const MEMORIES_COLLECTION = 'memories';
const USERS_COLLECTION = 'users';

/**
 * Generate AI prep brief for a meeting
 */
async function generateMeetingBrief(req, res, next) {
  try {
    const { uid } = req.user;
    const { meetingId } = req.params;

    const meetingRef = db.collection(MEETINGS_COLLECTION).doc(meetingId);
    const meetingDoc = await meetingRef.get();

    if (!meetingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    const meeting = { id: meetingDoc.id, ...meetingDoc.data() };

    if (meeting.userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this meeting'
      });
    }

    // Update meeting status to generating
    await meetingRef.update({ prepStatus: 'generating' });

    // Fetch user preferences
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    const userPreferences = userDoc.exists ? (userDoc.data().preferences || {}) : {};

    // Fetch memories for attendees
    const attendeeEmails = (meeting.attendees || [])
      .map(a => (a.email || '').toLowerCase().trim())
      .filter(Boolean);

    let memories = [];
    if (attendeeEmails.length > 0) {
      // Query memories for this user
      const memSnapshot = await db.collection(MEMORIES_COLLECTION)
        .where('userId', '==', uid)
        .get();

      memSnapshot.forEach(doc => {
        const mem = doc.data();
        if (attendeeEmails.includes((mem.attendeeEmail || '').toLowerCase())) {
          memories.push({ id: doc.id, ...mem });
        }
      });
    }

    // Generate brief
    const briefContent = await generateBrief(meeting, memories, userPreferences);

    // Save or update in Firestore
    let briefRef;
    if (meeting.prepBriefId) {
      briefRef = db.collection(PREP_BRIEFS_COLLECTION).doc(meeting.prepBriefId);
      await briefRef.set({
        ...briefContent,
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    } else {
      briefRef = await db.collection(PREP_BRIEFS_COLLECTION).add({
        ...briefContent,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
    }

    // Update meeting with prepBriefId and status 'ready'
    await meetingRef.update({
      prepStatus: 'ready',
      prepBriefId: briefRef.id,
      updatedAt: FieldValue.serverTimestamp()
    });

    const savedBriefDoc = await briefRef.get();

    return res.status(200).json({
      success: true,
      message: 'Prep brief generated successfully',
      prepBrief: { id: briefRef.id, ...savedBriefDoc.data() }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get prep brief for a meeting
 */
async function getMeetingBrief(req, res, next) {
  try {
    const { uid } = req.user;
    const { meetingId } = req.params;

    const meetingDoc = await db.collection(MEETINGS_COLLECTION).doc(meetingId).get();

    if (!meetingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    if (meetingDoc.data().userId !== uid) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have access to this meeting'
      });
    }

    const { prepBriefId } = meetingDoc.data();

    if (!prepBriefId) {
      return res.status(404).json({
        success: false,
        message: 'No prep brief has been generated for this meeting yet'
      });
    }

    const briefDoc = await db.collection(PREP_BRIEFS_COLLECTION).doc(prepBriefId).get();

    if (!briefDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Prep brief record not found'
      });
    }

    return res.status(200).json({
      success: true,
      prepBrief: { id: briefDoc.id, ...briefDoc.data() }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user custom notes on a prep brief
 */
async function updateCustomNotes(req, res, next) {
  try {
    const { uid } = req.user;
    const { meetingId } = req.params;
    const { customNotes = '' } = req.body;

    const meetingDoc = await db.collection(MEETINGS_COLLECTION).doc(meetingId).get();

    if (!meetingDoc.exists || meetingDoc.data().userId !== uid) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found or unauthorized'
      });
    }

    const { prepBriefId } = meetingDoc.data();
    if (!prepBriefId) {
      return res.status(404).json({
        success: false,
        message: 'Prep brief not found'
      });
    }

    const briefRef = db.collection(PREP_BRIEFS_COLLECTION).doc(prepBriefId);
    await briefRef.update({
      customNotes: String(customNotes),
      updatedAt: FieldValue.serverTimestamp()
    });

    const updatedDoc = await briefRef.get();

    return res.status(200).json({
      success: true,
      message: 'Custom notes updated',
      prepBrief: { id: updatedDoc.id, ...updatedDoc.data() }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateMeetingBrief,
  getMeetingBrief,
  updateCustomNotes
};
