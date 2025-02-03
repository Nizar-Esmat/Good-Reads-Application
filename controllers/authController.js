const Users = require("../models/Users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await Users.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not found" });
  
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return res.status(400).json({ message: "Invalid password" });
  
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
      res.json({ token });
    } catch (err) { 
      res.status(500).json({ error: err.message });
    }
  };

// register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
const Newrole = role || "user"
    const user = new Users({ name, email, password: hashedPassword, Newrole });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
