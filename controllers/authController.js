const Users = require("../models/Users");
const userOTP = require("../models/userOTP"); 
const TempUsers = require("../models/TempUsers");


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

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

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if an image file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a temporary user document
    const tempUser = new TempUsers({
      name,
      email,
      password: hashedPassword,
      role,
      avatar: req.file.path, // Cloudinary image URL
    });

    // Save the temporary user to the database
    await tempUser.save();

    // Send OTP to the user's email
    const otpResponse = await sendOTP({ _id: tempUser._id, email: tempUser.email });

    // Send the response to the client
    res.json(otpResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Verify OTP request
exports.verifyOTP = async (req, res) => {
  try {
    const { _id, otp } = req.body;
    if (!_id || !otp) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the OTP document
    const otpDocument = await userOTP.findOne({ userId: _id });
    if (!otpDocument) {
      return res.status(400).json({ message: "OTP not found" });
    }

    // Check if the OTP has expired
    if (otpDocument.expiresAt < Date.now()) {
      await userOTP.findByIdAndDelete(otpDocument._id);
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Compare the provided OTP with the hashed OTP
    const isValidOTP = await bcrypt.compare(otp, otpDocument.otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Find the temporary user document
    const tempUser = await TempUsers.findById(_id);
    if (!tempUser) {
      return res.status(400).json({ message: "User not found" });
    }

    // Create a new user in the Users collection
    const user = new Users({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      role: tempUser.role,
      avatar: tempUser.avatar,
      verified: true,
    });

    // Save the user to the Users collection
    await user.save();

    // Delete the temporary user document
    await TempUsers.findByIdAndDelete(_id);

    // Delete the OTP document
    await userOTP.findByIdAndDelete(otpDocument._id);

    res.json({ message: "Email verified and user registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Send OTP
const sendOTP = async ({ _id, email }) => {
  try {
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Hash the OTP
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    // Save the OTP to the database
    const newOTP = new userOTP({
      userId: _id,
      otp: hashedOtp,
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000, // OTP expires in 10 minutes
    });

    await newOTP.save();

    // Send the OTP via email
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "OTP for registration",
      text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
    };

    await transport.sendMail(mailOptions);

    // Return the OTP details
    return {
      status: "pending",
      message: "OTP sent successfully",
      data: {
        userId: _id,
        email: email,
      },
    };
  } catch (err) {
    throw new Error(err.message);
  }
};
// Middleware for handling image upload
exports.uploadImage = upload.single('avatar');