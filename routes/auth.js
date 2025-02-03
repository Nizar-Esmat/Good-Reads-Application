const express = require("express");
const router = express.Router();

let { login, register } = require("../controllers/authController");
// Register

router.post("/register", register);

// Login
router.post("/login", login);
  
module.exports = router;
