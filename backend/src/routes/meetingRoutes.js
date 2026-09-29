const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const {
  createMeeting,
  getMeetings,
  getMeeting,
  updateMeeting,
  deleteMeeting
} = require('../controllers/meetingController');

// All meeting routes require authentication
router.use(verifyAuth);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.get('/:id', getMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;
