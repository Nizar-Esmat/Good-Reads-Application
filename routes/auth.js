const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.uploadImage, authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/reset-password', authController.resetPassword);
router.post('/sendOTP' , authController.sendOTP);
router.post('/admin-login', authController.adminLogin);
router.get('/admin', authController.authAdmin);
router.get('/',authController.auth);
module.exports = router;    