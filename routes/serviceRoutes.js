const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { isAuthenticated, requireStudent } = require('../middleware/auth');

router.get('/create', isAuthenticated, requireStudent, serviceController.getCreateService);
router.post('/', isAuthenticated, requireStudent, serviceController.postCreateService);

router.get('/:id/edit', isAuthenticated, serviceController.getEditService);
router.post('/:id/edit', isAuthenticated, serviceController.postUpdateService);
router.post('/:id/delete', isAuthenticated, serviceController.postDeleteService);

module.exports = router;
