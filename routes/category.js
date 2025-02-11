const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

const {
  createCategory,
  addBooksToCategory,
  updateCategory,
  getCategoryById,
  getAllCategories,
  deleteCategory,
  uploadCoverImage
} = require("../controllers/categoryController");


router.post("/", auth, uploadCoverImage, createCategory);

router.post("/:id/add-books", auth, addBooksToCategory);

router.put("/:id", auth ,uploadCoverImage, updateCategory);

router.get("/:id", getCategoryById);

router.get("/", getAllCategories);

router.delete("/:id", auth, deleteCategory);

module.exports = router;