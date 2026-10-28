const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated, requireClient, requireStudent } = require('../middleware/auth');

// Create service request order
router.post('/orders', isAuthenticated, requireClient, orderController.postCreateOrder);

// View order details
router.get('/orders/:id', isAuthenticated, orderController.getOrderDetail);

// Update order status transition
router.post('/orders/:id/status', isAuthenticated, orderController.postUpdateOrderStatus);

// Role-specific Dashboards
router.get('/dashboard/freelancer', isAuthenticated, requireStudent, orderController.getFreelancerDashboard);
router.get('/dashboard/client', isAuthenticated, requireClient, orderController.getClientDashboard);

module.exports = router;
