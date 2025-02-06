const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.uploadImage, authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
module.exports = router;