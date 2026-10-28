const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { isAuthenticated, requireClient } = require('../middleware/auth');

router.get('/orders/:orderId/review', isAuthenticated, requireClient, reviewController.getCreateReview);
router.post('/orders/:orderId/review', isAuthenticated, requireClient, reviewController.postCreateReview);

module.exports = router;
