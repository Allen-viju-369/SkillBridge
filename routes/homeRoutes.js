const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const marketplaceController = require('../controllers/marketplaceController');

router.get('/', homeController.getHome);
router.get('/freelancers/:id', marketplaceController.getFreelancerProfile);

module.exports = router;
