const { db, FieldValue } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const MEETINGS_COLLECTION = 'meetings';

/**
 * Format Firestore document into standard meeting object
 */
function formatMeetingDoc(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...data
  };
}

/**
 * Create a new meeting document in Firestore
 * @param {Object} meetingData 
 * @returns {Promise<Object>} Created meeting object
 */
async function createMeeting(meetingData) {
  const docRef = await db.collection(MEETINGS_COLLECTION).add(meetingData);
  const createdDoc = await docRef.get();
  return formatMeetingDoc(createdDoc);
}

/**
 * Get a single meeting by its document ID
 * @param {string} meetingId 
 * @returns {Promise<Object|null>} Meeting object or null if not found
 */
async function getMeetingById(meetingId) {
  if (!meetingId || typeof meetingId !== 'string') return null;
  const doc = await db.collection(MEETINGS_COLLECTION).doc(meetingId).get();
  return formatMeetingDoc(doc);
}

/**
 * Get meetings for a specific user with filtering and pagination
 * @param {string} userId 
 * @param {Object} options 
 * @returns {Promise<{meetings: Array, pagination: Object}>}
 */
async function getMeetingsByUser(userId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(options.limit, 10) || 20), 50);
  const status = options.status;
  const timeframe = options.timeframe; // 'upcoming' | 'past'

  let query = db.collection(MEETINGS_COLLECTION).where('userId', '==', userId);

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  let meetings = [];

  const now = Date.now();

  snapshot.forEach(doc => {
    const data = doc.data();
    const meeting = {
      id: doc.id,
      ...data
    };

    // Calculate epoch time for sorting and timeframe filtering
    let startEpoch = 0;
    if (data.startTime) {
      if (data.startTime.toMillis) {
        startEpoch = data.startTime.toMillis();
      } else if (data.startTime.toDate) {
        startEpoch = data.startTime.toDate().getTime();
      } else if (data.startTime instanceof Date) {
        startEpoch = data.startTime.getTime();
      } else {
        startEpoch = new Date(data.startTime).getTime();
      }
    }
    meeting._startEpoch = startEpoch;

    // Optional timeframe filter (upcoming vs past)
    if (timeframe === 'upcoming' && startEpoch < now && data.status === 'completed') {
      return;
    }
    if (timeframe === 'past' && startEpoch >= now && data.status !== 'completed') {
      return;
    }

    meetings.push(meeting);
  });

  // Sort by startTime ascending (soonest first)
  meetings.sort((a, b) => a._startEpoch - b._startEpoch);

  // Remove internal sorting helper field
  meetings = meetings.map(({ _startEpoch, ...m }) => m);

  const total = meetings.length;
  const startIndex = (page - 1) * limit;
  const paginatedMeetings = meetings.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < total;

  return {
    meetings: paginatedMeetings,
    pagination: {
      page,
      limit,
      total,
      hasMore
    }
  };
}

/**
 * Update a meeting document
 * @param {string} meetingId 
 * @param {Object} updateData 
 * @returns {Promise<Object>} Updated meeting object
 */
async function updateMeeting(meetingId, updateData) {
  const docRef = db.collection(MEETINGS_COLLECTION).doc(meetingId);
  await docRef.update({
    ...updateData,
    updatedAt: FieldValue.serverTimestamp()
  });
  const updatedDoc = await docRef.get();
  return formatMeetingDoc(updatedDoc);
}

/**
 * Delete a meeting document
 * @param {string} meetingId 
 * @returns {Promise<boolean>}
 */
async function deleteMeeting(meetingId) {
  await db.collection(MEETINGS_COLLECTION).doc(meetingId).delete();
  return true;
}

module.exports = {
  createMeeting,
  getMeetingById,
  getMeetingsByUser,
  updateMeeting,
  deleteMeeting
};
