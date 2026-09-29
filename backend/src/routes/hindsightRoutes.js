const express = require('express');
const router = express.Router();
const hindsightController = require('../controllers/hindsightController');
const { verifyAuth } = require('../middleware/auth');

// All Hindsight routes require authentication
router.use(verifyAuth);

router.get('/health', hindsightController.getHealth);
router.post('/retain', hindsightController.retain);
router.post('/recall', hindsightController.recall);
router.post('/reflect', hindsightController.reflect);

module.exports = router;
