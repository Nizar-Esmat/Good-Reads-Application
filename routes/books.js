const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

let {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require("../controllers/bookController");


router.post("/", auth, createBook);
router.get("/", getAllBooks);
router.get("/:id", getBookById);
router.put("/:id", auth, updateBook);
router.delete("/:id", auth, deleteBook);

module.exports = router;
