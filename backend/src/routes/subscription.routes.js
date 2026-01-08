const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const subscriptionController = require('../controllers/subscription.controller');

// All routes require authentication
router.use(authMiddleware);

// Get current subscription status
router.get('/status', subscriptionController.getSubscriptionStatus);

// Generate PIX payment
router.post('/generate-pix', subscriptionController.generatePix);

// Check payment status
router.get('/check-payment/:invoiceId/:installmentId', subscriptionController.checkPayment);

module.exports = router;
