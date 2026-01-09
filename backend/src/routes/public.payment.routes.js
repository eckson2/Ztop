const express = require('express');
const router = express.Router();
const PublicPaymentController = require('../controllers/public.payment.controller');

// No auth middleware here! It's public.
router.get('/:id', PublicPaymentController.getInfo);
router.post('/:id/pay', PublicPaymentController.process);

module.exports = router;
