const User = require("../models/Users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "user_avatars", // Folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
    transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional: Resize image
  },
});

const upload = multer({ storage: storage });

exports.updateUser = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log the request body
    console.log("Request Params:", req.params); // Log the request params
    console.log("Request File:", req.file); // Log the uploaded file (if any)

    const { name, email, password, role } = req.body;

    // Check if the requester is the owner of the profile or an admin
    if (req.user.role !== "admin" && req.user.id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Prepare the update object
    const updateData = {};
    if (name) updateData.name = name; // Update name if provided
    if (email) updateData.email = email; // Update email if provided
    if (role && req.user.role === "admin") updateData.role = role; // Update role if provided and requester is admin

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      const hashedPassword = await bcrypt.hash(password, 10); // Hash the new password
      updateData.password = hashedPassword;
    }

    // Upload new avatar to Cloudinary if a file is provided
    if (req.file) {
      try {
        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "user_avatars", // Folder in Cloudinary
          resource_type: "image", // Ensure it's treated as an image
        });
        updateData.avatar = result.secure_url; // Use the Cloudinary URL for the avatar
      } catch (error) {
        console.error("Cloudinary Upload Error Details:", error.message); // Log the error details
        return res.status(500).json({ error: "Failed to upload avatar to Cloudinary", details: error.message });
      }
    }

    console.log("Update Data:", updateData); // Log the data being updated

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send the updated user as a response (excluding the password)
    const userResponse = { ...updatedUser.toObject() };
    delete userResponse.password; // Remove the password from the response

    res.json({ message: "User updated successfully", user: userResponse });
  } catch (err) {
    console.error("Error updating user:", err); // Log the error
    res.status(500).json({ error: err.message });
  }
};
exports.uploadImage = upload.single('avatar');
// Delete a user (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Get all users    
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find().select('-password').skip(skip).limit(limit);
    const totalUsers = await User.countDocuments();

    res.json({
      array: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      total: totalUsers
    });
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
