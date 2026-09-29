const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middleware/auth');
const {
  listMemories,
  createMemory,
  deleteMemory
} = require('../controllers/memoryController');

// All memory routes require authentication
router.use(verifyAuth);

router.get('/', listMemories);
router.post('/', createMemory);
router.delete('/:id', deleteMemory);

module.exports = router;
