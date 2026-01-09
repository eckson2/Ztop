const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/settings', PaymentController.getSettings);
router.put('/settings', PaymentController.updateSettings);

module.exports = router;
