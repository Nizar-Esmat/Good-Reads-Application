const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require("../middleware/auth");

// Route to create a new book
router.post('/' , auth, bookController.uploadBookFiles, bookController.createBook);

// Route to get all books
router.get('/books', bookController.getAllBooks);

// Route to get a book by ID
router.get('/books/:id', bookController.getBookById);

// Route to update a book
router.put('/books/:id', bookController.updateBook);

// Route to delete a book
router.delete('/books/:id', bookController.deleteBook);

module.exports = router;