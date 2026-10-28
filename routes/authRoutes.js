const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

router.get('/login', isGuest, authController.getLogin);
router.post('/login', authLimiter, authController.postLogin);

router.get('/register', isGuest, authController.getRegister);
router.post('/register', authLimiter, authController.postRegister);

router.post('/logout', isAuthenticated, authController.postLogout);

module.exports = router;
