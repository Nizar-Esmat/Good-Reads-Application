const express = require("express");
const User = require("../models/Users");
const auth = require("../middleware/auth");

const router = express.Router();

// Get all users (Admin only)
router.get("/", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  const users = await User.find();
  res.json(users);
});

// Get a user by ID
router.get("/:id", auth, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// Update a user (Admin and User)
router.put("/:id", auth, async (req, res) => {
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

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user (Admin only)
router.delete("/:id", auth, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Access denied" });

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

module.exports = router;
