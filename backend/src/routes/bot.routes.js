const express = require('express');
const router = express.Router();
const botController = require('../controllers/bot.controller');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, botController.getConfig);
router.post('/', authMiddleware, botController.saveConfig);

module.exports = router;
