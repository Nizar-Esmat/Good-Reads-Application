const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const auth = require("../middleware/auth");

// Route to create a new book
router.post("/", auth, bookController.createBook);

router.get("/half-pdf", bookController.halfpdf);

// Route to get all books
router.get("/", bookController.getAllBooks);

// Route to get a book by ID
router.get("/:id", bookController.getBookById);

// Route to update a book (including file uploads)
router.put("/:id", auth, bookController.updateBook);

// Route to delete a book
router.delete("/:id", auth, bookController.deleteBook);

// Route to add a click to a book
router.put("/add-clicked/:id", bookController.addclicked);


//get book by name
router.get("/getBookByName/:bookName", bookController.getBookByName);



module.exports = router;