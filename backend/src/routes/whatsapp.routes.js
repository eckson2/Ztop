const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, whatsappController.getInstance);
router.post('/', authMiddleware, whatsappController.saveInstance);
router.get('/qr', authMiddleware, whatsappController.getConnectQR);
router.post('/webhook', authMiddleware, whatsappController.configureWebhook); // Manual trigger
router.delete('/', authMiddleware, whatsappController.deleteInstance); // Reset / Disconnect

// Evolution Specific Routes
router.post('/settings', authMiddleware, whatsappController.updateSettings);
router.post('/typebot', authMiddleware, whatsappController.updateTypebot);

module.exports = router;
