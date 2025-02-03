const Users = require("../models/Users");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'user_avatars',
    format: async (req, file) => 'png',
    public_id: (req, file) => `avatar-${Date.now()}`,
  },
});


const upload = multer({ storage: storage });

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

// Register with image upload
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // Check if an image file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with the Cloudinary image URL
    const user = new Users({
      name,
      email,
      password: hashedPassword,
      role,
      avatar:await req.file.path, // Cloudinary image URL
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Middleware for handling image upload
exports.uploadImage = upload.single('avatar');