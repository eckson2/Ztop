const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const autotestController = require('../controllers/autotest.controller');

router.get('/', authMiddleware, autotestController.getConfig);
router.post('/', authMiddleware, autotestController.updateConfig);

module.exports = router;
