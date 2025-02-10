const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

// Import the authorController and upload middleware
const authorController = require("../controllers/authorController");

// Routes
router.post('/', auth, authorController.upload.single('avatar'), authorController.createAuthor); // Create a new author
router.get("/", authorController.getAllAuthors); // Get all authors
router.get("/:id", authorController.getAuthorById); // Get an author by ID
router.get('/name/:name', authorController.getAuthorByName); // Get an author by name
router.put("/:authorId/books", auth, authorController.addBookToAuthor); // Add a book to an author
router.put("/:id", auth, authorController.updateAuthor); // Update an author
router.delete("/:authorId/book/:bookId", auth, authorController.deleteBookFromAuthor); // Delete a book from an author
router.delete("/:id", auth, authorController.deleteAuthor); // Delete an author

module.exports = router;