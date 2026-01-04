const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');
const planLimitMiddleware = require('../middleware/planLimit');

router.post('/whatsapp/:userId', planLimitMiddleware, webhookController.handleWebhook);

module.exports = router;
