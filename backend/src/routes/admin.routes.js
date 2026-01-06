const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// All routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN'));

router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);

module.exports = router;
