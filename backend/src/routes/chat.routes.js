const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth');

router.get('/active', authMiddleware, chatController.getActiveChats);
router.post('/toggle-bot', authMiddleware, chatController.toggleBot);
router.post('/send', authMiddleware, chatController.sendMessage);
router.get('/history', authMiddleware, chatController.getHistory);

module.exports = router;
