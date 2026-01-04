const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, whatsappController.getInstance);
router.post('/', authMiddleware, whatsappController.saveInstance);
router.get('/qr', authMiddleware, whatsappController.getConnectQR);

module.exports = router;
