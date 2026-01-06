const express = require('express');
const router = express.Router();
const fulfillmentController = require('../controllers/fulfillment.controller');

router.post('/', fulfillmentController.handleFulfillment);

module.exports = router;
