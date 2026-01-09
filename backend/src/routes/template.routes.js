const express = require('express');
const router = express.Router();
const MessageTemplateController = require('../controllers/template.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', MessageTemplateController.list);
router.post('/', MessageTemplateController.create);
router.put('/:id', MessageTemplateController.update);
router.delete('/:id', MessageTemplateController.delete);

module.exports = router;
