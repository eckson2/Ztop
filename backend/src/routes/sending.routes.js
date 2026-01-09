const express = require('express');
const router = express.Router();
const SendingController = require('../controllers/sending.controller');
const authMiddleware = require('../middleware/auth');

// Categories
router.get('/categories', authMiddleware, SendingController.listCategories);
router.post('/categories', authMiddleware, SendingController.createCategory);
router.put('/categories/:id', authMiddleware, SendingController.updateCategory);
router.delete('/categories/:id', authMiddleware, SendingController.deleteCategory);

// Rules
router.post('/categories/:categoryId/rules', authMiddleware, SendingController.createRule);
router.delete('/rules/:id', authMiddleware, SendingController.deleteRule);

module.exports = router;
