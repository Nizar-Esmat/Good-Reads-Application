const Users = require("../models/Users");
const userOTP = require("../models/userOTP"); 
const TempUsers = require("../models/TempUsers");


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const nodemailer = require('nodemailer');
const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
});

const resgisterSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "string.empty": "Email is required",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  role: Joi.string().default("user")
});

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
//auth if user exists
exports.auth = (req, res) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const tokenWithoutBearer = token.replace("Bearer ", "").trim();
    const decodedUser = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
    res.status(200).json({
      id: decodedUser.id,
    })
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};
exports.authAdmin = (req, res) => {

  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access denied" });
  else{
    try {
      const tokenWithoutBearer = token.replace("Bearer ", "").trim();
      const decodedUser = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
      if(decodedUser.role !== "admin"){
        return res.status(403).json({ message: "Access denied. Admin privileges required." });
      }
      else {
        res.status(200).json({
          id: decodedUser.id,
        })
      }
    } catch (err) {
      res.status(400).json({ message: "Invalid token" });
    }
  }
};

// Login
exports.login = async (req, res) => {
  try {
    // Validate the request body
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { email, password } = req.body;

    // Check if the user exists
    const user = await Users.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if the password is valid
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ message: "Invalid password" });

    // Generate a JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    // Send the token in the response
    res.json({ 
      token,
      user
     });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// login admin only
exports.adminLogin = async (req , res) =>{
  try{
  const {error} = loginSchema.validate(req.body)

  if(error){
    return res.status(400).json({message : error.details[0].message})
  }

  const {email , password} = req.body

  const user = await Users.findOne({email})

  if(!user){
    return res.status(400).json({message : "uesr not found"})
  }

  if(user.role !== "admin"){
    return res.status(403).json({ message: "Access denied. Admin privileges required." }); 
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(400).json({ message: "Invalid password" });
  }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

    res.json({ token });
}catch(err){
  res.status(500).json({error : err.message})
}
}
// Register
exports.register = async (req, res) => {
  try {
    const { error } = resgisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password } = req.body;


    // Default profile picture URL
    const DEFAULT_PROFILE_PICTURE =
      "https://res.cloudinary.com/dqmnyaqev/image/upload/v1739210735/user_avatars/avatar-1739210734375.png";

    // Use the uploaded image or the default image
    const avatar = req.file ? req.file.path : DEFAULT_PROFILE_PICTURE;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a temporary user document
    const tempUser = new TempUsers({
      name,
      email,
      password: hashedPassword,
      role : "user",
      avatar, // Use the uploaded image or the default image
    });

    // Save the temporary user to the database
    await tempUser.save();

    // Send OTP to the user's email
    const otpResponse = await sendOTP({ email: tempUser.email });

    // Send the response to the client
    res.json(otpResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// RegisterInAdmin
exports.registerInAdmin = async (req, res) => {
  try {
    const { error } = resgisterSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { name, email, password, role } = req.body;

    // Default profile picture URL
    const DEFAULT_PROFILE_PICTURE =
      "https://res.cloudinary.com/dqmnyaqev/image/upload/v1739210735/user_avatars/avatar-1739210734375.png";

    // Use the uploaded image or the default image
    const avatar = req.file ? req.file.path : DEFAULT_PROFILE_PICTURE;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a user document
    const user = new Users({
      name,
      email,
      password: hashedPassword,
      role,
      avatar, // Use the uploaded image or the default image
    });

    // Save the user to the database
    await user.save();

    // Send the response to the client
    res.status(201).json({ message: "User created successfully", user });
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

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    let { email } = req.body;

    
    if (!email) {
      return res.status(400).json({ message: "Missing required fields" });
    }else{
      const user = await Users.findOne({ email });
      if (!user) return res.status(400).json({ message: "User not found" });
      const userId = user._id
      await userOTP.deleteMany({userId});
      // sendOTP({user._id,email} ,res);
    }
  } catch (err) {
    res.json({
      status:"failed",
      message:err.message
    })


  }
}


// Reset password after verifying the OTP
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find user using email
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    console.log(user)
    const userId = user._id;
    const otpDocument = await userOTP.findOne({ userId });
    if (!otpDocument) {
      return res.status(400).json({ message: "OTP not found" });
    }
    console.log(otpDocument.otp, otp.toString())
    const isOtpValid = await bcrypt.compare(otp.toString(), otpDocument.otp);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpDocument.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // console.log(newPassword, user.password, hashedPassword)
    const isValidPassword = await bcrypt.compare(newPassword, user.password);
    if (isValidPassword) {
      return res.status(400).json({ message: "New password cannot be the same as the old password" });
    } 

    await Users.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    // Step 7: Delete the OTP document
    await userOTP.findByIdAndDelete(otpDocument._id);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// request OTP
exports.sendOTP = async (req, res) => {
  //method Send OTP
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Send the OTP
    const result = await sendOTP({email});

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const sendOTP = async ({email}) => {
  try {
    // Generate a 4-digit OTP
    const otp = (Math.floor(1000 + Math.random() * 9000))

    // Hash the OTP
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    let user = await Users.findOne({ email });
    if (!user) {
      user = await TempUsers.findOne({ email });
    } 
    if (!user) {
      throw new Error("User not found");
    } 
    //ensure there aren't any old OTPs
    await userOTP.deleteMany({ userId: user._id });
    // Save the OTP to the database
    const newOTP = new userOTP({
      userId: user._id,
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
        userId: user._id,
        email: user.email,
      },
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

// Middleware for handling image upload
exports.uploadImage = upload.single('avatar');