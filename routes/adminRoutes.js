const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin role
router.use(isAuthenticated, requireAdmin);

router.get('/', adminController.getDashboard);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users/:id/toggle-status', adminController.postToggleUserStatus);
router.post('/users/:id/toggle-verify', adminController.postToggleUserVerification);

// Service Moderation
router.get('/services', adminController.getServices);
router.post('/services/:id/toggle', adminController.postToggleService);

// Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.postCreateCategory);
router.post('/categories/:id/toggle', adminController.postToggleCategory);

// Platform Orders Oversight
router.get('/orders', adminController.getOrders);

module.exports = router;
