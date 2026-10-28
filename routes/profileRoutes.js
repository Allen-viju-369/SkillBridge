const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/edit', isAuthenticated, profileController.getEditProfile);
router.post('/edit', isAuthenticated, profileController.postUpdateProfile);

module.exports = router;
