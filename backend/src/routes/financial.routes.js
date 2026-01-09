const express = require('express');
const router = express.Router();
const FinancialController = require('../controllers/financial.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Dashboard & Logs
router.get('/dashboard', FinancialController.getDashboard);
router.get('/logs', FinancialController.getLogs);

// Manual Methods
router.get('/methods', FinancialController.listMethods);
router.post('/methods', FinancialController.createMethod);
router.delete('/methods/:id', FinancialController.deleteMethod);

module.exports = router;
