const express = require("express");
const auth = require("../middleware/auth");
const multer = require("multer");



const router = express.Router();

let {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  uploadImage
} = require("../controllers/userController");


router.get('/', getAllUsers)
router.get('/:id', getUserById)
router.put("/:id", auth, uploadImage, updateUser);
router.delete('/:id', auth, deleteUser)

module.exports = router;