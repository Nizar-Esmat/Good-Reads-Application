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
} = require("../controllers/categoryController");

const { uploadCoverImage } = require("../controllers/categoryController");

router.post("/", uploadCoverImage, auth, createCategory);

router.post("/:id/add-books", auth, addBooksToCategory);

router.put("/:id", auth, updateCategory);

router.get("/:id", getCategoryById);

router.get("/", getAllCategories);

router.delete("/:id", auth, deleteCategory);

module.exports = router;