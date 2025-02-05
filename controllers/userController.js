let User = require("../models/Users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get all users    
exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select('-password'); 
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
// Get a user by ID
 exports.getUserById = async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
 }

// Update a user (Admin and User)
 exports.updateUser = async (req, res) => {
    try {
      const { name, email, role } = req.body;
  
      if (req.user.role !== "admin" && req.user.id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { name, email, role },
        { new: true }
      );
      res.json(updatedUser);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
    // Delete a user (Admin only)
  exports.deleteUser = async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: "User deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }


  