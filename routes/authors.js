const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

let {
    createAuthor,
    getAllAuthors,
    getAuthorById,
    addBookToAuthor,
    updateAuthor,
    deleteBookFromAuthor,
    deleteAuthor,
  } = require("../controllers/authorController");


router.post("/", auth,createAuthor);
router.get("/", getAllAuthors);
router.get("/:id", getAuthorById);
router.put("/:authorId/books", addBookToAuthor);
router.put("/:id", auth,updateAuthor);
router.delete("/:authorId/book/:bookId", auth,deleteBookFromAuthor);
router.delete("/:id", auth,deleteAuthor);

module.exports = router;