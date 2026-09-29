const meetingRepository = require('../repositories/meetingRepository');
const { FieldValue } = require('../config/firebase');
const { Timestamp } = require('firebase-admin/firestore');

const ALLOWED_STATUSES = ['upcoming', 'in_progress', 'completed', 'cancelled'];
const ALLOWED_PREP_STATUSES = ['pending', 'generating', 'ready', 'failed'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate ISO date string or Date object
 */
function parseValidDate(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Validate attendee array
 */
function validateAttendees(attendees, details) {
  if (!Array.isArray(attendees)) {
    details.push('attendees must be an array');
    return [];
  }

  return attendees.map((attendee, index) => {
    if (typeof attendee === 'string') {
      return {
        name: attendee.trim(),
        email: '',
        company: '',
        role: '',
        linkedinUrl: ''
      };
    }

    if (typeof attendee !== 'object' || attendee === null) {
      details.push(`attendees[${index}] must be an object`);
      return null;
    }

    const name = typeof attendee.name === 'string' ? attendee.name.trim() : '';
    const email = typeof attendee.email === 'string' ? attendee.email.trim().toLowerCase() : '';
    const company = typeof attendee.company === 'string' ? attendee.company.trim() : '';
    const role = typeof attendee.role === 'string' ? attendee.role.trim() : '';
    const linkedinUrl = typeof attendee.linkedinUrl === 'string' ? attendee.linkedinUrl.trim() : '';

    if (email && !EMAIL_REGEX.test(email)) {
      details.push(`attendees[${index}].email "${email}" is not a valid email address`);
    }

    return {
      name,
      email,
      company,
      role,
      linkedinUrl
    };
  }).filter(Boolean);
}

/**
 * Create a new meeting
 * POST /api/meetings
 */
async function createMeeting(req, res, next) {
  try {
    const userId = req.user.uid;
    const {
      title,
      description = '',
      startTime,
      endTime,
      location = '',
      attendees = [],
      status = 'upcoming'
    } = req.body;

    const validationErrors = [];

    // Title validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      validationErrors.push('title is required and must be a non-empty string');
    }

    // StartTime validation
    const parsedStart = parseValidDate(startTime);
    if (!parsedStart) {
      validationErrors.push('startTime must be a valid ISO date string');
    }

    // EndTime validation
    let parsedEnd = null;
    if (endTime) {
      parsedEnd = parseValidDate(endTime);
      if (!parsedEnd) {
        validationErrors.push('endTime must be a valid ISO date string');
      } else if (parsedStart && parsedEnd.getTime() <= parsedStart.getTime()) {
        validationErrors.push('endTime must be after startTime');
      }
    }

    // Status validation
    if (status && !ALLOWED_STATUSES.includes(status)) {
      validationErrors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }

    // Attendees validation
    const sanitizedAttendees = validateAttendees(attendees, validationErrors);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    const meetingPayload = {
      userId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      startTime: Timestamp.fromDate(parsedStart),
      endTime: parsedEnd ? Timestamp.fromDate(parsedEnd) : null,
      location: typeof location === 'string' ? location.trim() : '',
      attendees: sanitizedAttendees,
      status: status || 'upcoming',
      prepStatus: 'pending',
      prepBriefId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const createdMeeting = await meetingRepository.createMeeting(meetingPayload);

    return res.status(201).json({
      success: true,
      data: createdMeeting
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get meetings for authenticated user
 * GET /api/meetings
 */
async function getMeetings(req, res, next) {
  try {
    const userId = req.user.uid;
    const { status, timeframe, page, limit } = req.query;

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status parameter. Must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const result = await meetingRepository.getMeetingsByUser(userId, {
      status,
      timeframe,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: result.meetings,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single meeting by ID
 * GET /api/meetings/:id
 */
async function getMeeting(req, res, next) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const meeting = await meetingRepository.getMeetingById(id);

    // Enforce strict ownership check - Safe 404 to avoid leaking existence
    if (!meeting || meeting.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a meeting
 * PUT /api/meetings/:id
 */
async function updateMeeting(req, res, next) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const updates = req.body;

    const existingMeeting = await meetingRepository.getMeetingById(id);

    // Enforce strict ownership check
    if (!existingMeeting || existingMeeting.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    const validationErrors = [];
    const updateData = {};

    // Validate title if provided
    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || !updates.title.trim()) {
        validationErrors.push('title must be a non-empty string');
      } else {
        updateData.title = updates.title.trim();
      }
    }

    // Validate description if provided
    if (updates.description !== undefined) {
      if (typeof updates.description !== 'string') {
        validationErrors.push('description must be a string');
      } else {
        updateData.description = updates.description.trim();
      }
    }

    // Validate location if provided
    if (updates.location !== undefined) {
      if (typeof updates.location !== 'string') {
        validationErrors.push('location must be a string');
      } else {
        updateData.location = updates.location.trim();
      }
    }

    // Validate status if provided
    if (updates.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(updates.status)) {
        validationErrors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
      } else {
        updateData.status = updates.status;
      }
    }

    // Validate prepStatus if provided
    if (updates.prepStatus !== undefined) {
      if (!ALLOWED_PREP_STATUSES.includes(updates.prepStatus)) {
        validationErrors.push(`prepStatus must be one of: ${ALLOWED_PREP_STATUSES.join(', ')}`);
      } else {
        updateData.prepStatus = updates.prepStatus;
      }
    }

    // Validate attendees if provided
    if (updates.attendees !== undefined) {
      const sanitizedAttendees = validateAttendees(updates.attendees, validationErrors);
      if (validationErrors.length === 0) {
        updateData.attendees = sanitizedAttendees;
      }
    }

    // Validate startTime & endTime logic
    let effectiveStartTime = existingMeeting.startTime ? (existingMeeting.startTime.toDate ? existingMeeting.startTime.toDate() : new Date(existingMeeting.startTime)) : null;
    let effectiveEndTime = existingMeeting.endTime ? (existingMeeting.endTime.toDate ? existingMeeting.endTime.toDate() : new Date(existingMeeting.endTime)) : null;

    if (updates.startTime !== undefined) {
      const parsedStart = parseValidDate(updates.startTime);
      if (!parsedStart) {
        validationErrors.push('startTime must be a valid ISO date string');
      } else {
        effectiveStartTime = parsedStart;
        updateData.startTime = Timestamp.fromDate(parsedStart);
      }
    }

    if (updates.endTime !== undefined) {
      if (updates.endTime === null) {
        effectiveEndTime = null;
        updateData.endTime = null;
      } else {
        const parsedEnd = parseValidDate(updates.endTime);
        if (!parsedEnd) {
          validationErrors.push('endTime must be a valid ISO date string or null');
        } else {
          effectiveEndTime = parsedEnd;
          updateData.endTime = Timestamp.fromDate(parsedEnd);
        }
      }
    }

    if (effectiveStartTime && effectiveEndTime && effectiveEndTime.getTime() <= effectiveStartTime.getTime()) {
      validationErrors.push('endTime must be after startTime');
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Ensure protected fields are not modified
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    const updatedMeeting = await meetingRepository.updateMeeting(id, updateData);

    return res.status(200).json({
      success: true,
      data: updatedMeeting
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a meeting
 * DELETE /api/meetings/:id
 */
async function deleteMeeting(req, res, next) {
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const existingMeeting = await meetingRepository.getMeetingById(id);

    // Enforce strict ownership check
    if (!existingMeeting || existingMeeting.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found'
      });
    }

    await meetingRepository.deleteMeeting(id);

    return res.status(200).json({
      success: true,
      data: {
        id,
        deleted: true
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting
};
