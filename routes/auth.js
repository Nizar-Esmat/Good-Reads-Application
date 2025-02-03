
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authContoller');

router.post('/register', authController.uploadImage, authController.register);
router.post('/login', authController.login);

module.exports = router;