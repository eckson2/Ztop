const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');

router.get('/users', authMiddleware, isAdmin, adminController.listUsers);
router.patch('/users/:id/status', authMiddleware, isAdmin, adminController.toggleUserStatus);

module.exports = router;
