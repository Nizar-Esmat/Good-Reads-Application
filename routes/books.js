const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require("../middleware/auth");

// Route to create a new book
router.post('/' , auth, bookController.uploadBookFiles, bookController.createBook);

// Route to get all books
router.get('/', bookController.getAllBooks);

// Route to get a book by ID
router.get('/:id', bookController.getBookById);

// Route to update a book
router.put('/:id', bookController.updateBook);

// Route to delete a book
router.delete('/:id', auth, bookController.deleteBook);

// Route to add a click to a book
router.put('/add-clicked/:id', bookController.addclicked);  

module.exports = router;