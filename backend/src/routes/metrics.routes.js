const express = require('express');
const router = express.Router();
const MetricsController = require('../controllers/metrics.controller');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, MetricsController.getDashboard);

module.exports = router;
