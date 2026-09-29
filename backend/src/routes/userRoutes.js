const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const { 
  syncUser, 
  getProfile, 
  updateProfile, 
  updatePreferences 
} = require('../controllers/userController');

// All user routes require authentication
router.use(verifyAuth);

router.post('/sync', syncUser);
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/preferences', updatePreferences);

module.exports = router;
