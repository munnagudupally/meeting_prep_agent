const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const {
  generateMeetingBrief,
  getMeetingBrief,
  updateCustomNotes
} = require('../controllers/prepController');

// All prep routes require authentication
router.use(verifyAuth);

router.post('/:meetingId/generate', generateMeetingBrief);
router.get('/:meetingId', getMeetingBrief);
router.patch('/:meetingId/notes', updateCustomNotes);

module.exports = router;
