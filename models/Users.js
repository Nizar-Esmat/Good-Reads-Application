const { verify } = require("jsonwebtoken");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String , default: "user" },
  dateOfBirth: { type: Date },
  avatar: { type: String },
});

module.exports = mongoose.model("User", UserSchema);
