const express = require('express');
const router = express.Router();
const fulfillmentController = require('../controllers/fulfillment.controller');

router.post('/:userId', fulfillmentController.handleFulfillment);

module.exports = router;
