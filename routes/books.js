const express = require("express");
const Book = require("../models/Books");
const auth = require("../middleware/auth");

const router = express.Router();

// Create a new book (admin or author)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "author") {
      return res.status(403).json({ message: "Access denied" });
    }
    const {
      bookName,
      authorName,
      averageRating,
      ratings,
      reviews,
      categoryName,
      description,
      coverImage,
      shelve,
    } = req.body;
    const book = new Book({
      bookName,
      authorName,
      averageRating: averageRating || 0,
      ratings: ratings || 0,
      reviews: reviews || [],
      categoryName,
      description,
      coverImage,
      shelve: shelve || "Want To Read",
      author: req.user._id,
    });
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Book (Author)
router.put("/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.author) {
      return res.status(400).json({ message: "Book does not have an author." });
    }
    if (book.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied: You are not the author of this book",
      });
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a book(Admin or Author)
router.delete("/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (req.user.role !== "admin" && book.author !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Access denied: You are not the author of this book",
      });
    }
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
