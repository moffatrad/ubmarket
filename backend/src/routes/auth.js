const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { upload } = require('../config/upload');
const authController = require('../controllers/authController');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.put('/profile', authenticate, upload.single('avatar'), authController.updateProfile);

module.exports = router;