const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', CustomerController.list);
router.post('/', CustomerController.create);
router.put('/:id', CustomerController.update);
router.delete('/:id', CustomerController.delete);

// Actions
router.post('/:id/renew', CustomerController.renew);
router.get('/:id/history', CustomerController.getHistory);

module.exports = router;
