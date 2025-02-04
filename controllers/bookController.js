const Book = require("../models/Books");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer storage for cover images
const coverImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "book_covers", // Folder for cover images
    format: async (req, file) => "png", // Default format
    public_id: (req, file) => `cover-${Date.now()}`, // Unique public ID
    resource_type: "image", // Explicitly set resource_type to "image"
  },
});


const bookFileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "book_files", // Folder for book files
    //format: async (req, file) => "pdf", // Default format
    public_id: (req, file) => `book-${Date.now()}`, // Unique public ID
    resource_type: "raw", // Explicitly set resource_type to "raw"
  },
});

// Create Multer upload middleware for cover images
const uploadCoverImage = multer({ storage: coverImageStorage });

// Create Multer upload middleware for book files
const uploadBookFile = multer({ storage: bookFileStorage });

// Combine both upload middlewares
exports.uploadBookFiles = multer({
  storage: coverImageStorage, // Use coverImageStorage as the default storage
}).fields([
  { name: 'coverImage', maxCount: 1 }, // Field name for cover image
  { name: 'bookFile', maxCount: 1 },   // Field name for book file
]);

// Create a new book (admin only)
exports.createBook = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" }); }
    const {
      bookName,
      authorName,
      averageRating,
      ratings,
      reviews,
      categoryName,
      description,
      coverImage,
      bookFile,
      shelve,  } = req.body;

    const existingBook = await Book.findOne({ bookName, authorName });
    if (existingBook) {
      return res.status(400).json({ message: "This book already exists" });
    }

    const book = new Book({
      bookName: bookName,
      authorName: authorName,
      averageRating: averageRating || 0,
      ratings: ratings || 0,
      reviews: reviews || [],
      categoryName: categoryName || "Unknown",
      description: description || "",
      coverImage: coverImage || "",
      shelve: shelve || "Want To Read",
    });
    await book.save();
    res.status(201).json({ message: "Book created successfully", book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  // Extract fields from the request body
  const {
    bookName,
    authorName,
    averageRating,
    ratings,
    reviews,
    categoryName,
    description,
    shelve,
  } = req.body;

  // Check if the book already exists
  const existingBook = await Book.findOne({ bookName, authorName });
  if (existingBook) {
    return res.status(400).json({ message: "This book already exists" });
  }

  // Upload cover image to Cloudinary
  let coverImageUrl = "";
  if (req.files['coverImage']) {
    const coverImageResult = await cloudinary.uploader.upload(req.files['coverImage'][0].path, {
      folder: "book_covers",
      resource_type: "image",
    });
    coverImageUrl = coverImageResult.secure_url;
  }

  // Upload book file to Cloudinary
  let bookFileUrl = "";
  if (req.files['bookFile']) {
    const bookFileResult = await cloudinary.uploader.upload(req.files['bookFile'][0].path, {
      folder: "book_files",
      resource_type: "raw",
    });
    bookFileUrl = bookFileResult.secure_url;
  }

  // Create a new book with the uploaded cover image and book file
  const book = new Book({
    bookName,
    authorName,
    averageRating: averageRating || 0,
    ratings: ratings || 0,
    reviews: reviews || [],
    categoryName: categoryName || "Unknown",
    description: description || "",
    coverImage: await coverImageUrl, // Use the Cloudinary URL for the cover image
    bookFile: await bookFileUrl,     // Use the Cloudinary URL for the book file
    shelve: shelve || "Want To Read",
  });

  // Save the book to the database
  await book.save();

  // Send the response   
  res.status(201).json({
    message: "Book created successfully",
    book: book,
  });
} 
// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a book by ID
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  try {
    const { bookName, authorName, averageRating, ratings, reviews, categoryName, description, shelve } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Update fields
    book.bookName = bookName || book.bookName;
    book.authorName = authorName || book.authorName;
    book.averageRating = averageRating || book.averageRating;
    book.ratings = ratings || book.ratings;
    book.reviews = reviews || book.reviews;
    book.categoryName = categoryName || book.categoryName;
    book.description = description || book.description;
    book.shelve = shelve || book.shelve;

    // Save the updated book
    await book.save();

    res.status(200).json({
      message: "Book updated successfully",
      book: book,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Export the upload middleware
exports.upload = multer();
