const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.uploadImage, authController.register);
router.post('/login', authController.login);

module.exports = router;