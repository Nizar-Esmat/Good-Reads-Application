const Book = require("../models/Books");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Authors = require("../models/Authors");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "bookFile" && file.mimetype.startsWith("application/")) {
      cb(null, true);
    } else if (file.fieldname === "coverImage" && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  },
}).fields([
  { name: "bookFile", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);


exports.createBook = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" }); }
  // Extract fields from the request body
  const {
    bookName,
    authorName,
    averageRating,
    ratings,
    reviews,
    categoryName,
    description,
  } = req.body;

    upload(req, res, async (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({ error: err.message });
      }

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

      const existingBook = await Book.findOne({ bookName });
      if (existingBook) {
        return res.status(400).json({ message: "Book already exists" });
      }

      let author = await Authors.findOne({ authorName });
      if (!author) {
        author = new Authors({ authorName });
        await author.save();
      }

      let bookFileUrl, coverImageUrl;

      try {
        console.log("Uploading book file to Cloudinary...");
        const bookFileResult = await cloudinary.uploader.upload(req.files["bookFile"][0].path, {
          folder: "book_files",
          resource_type: "raw",
          access_mode: "public",
          public_id: `book-${Date.now()}.${req.files["bookFile"][0].originalname.split('.').pop()}`,
          format: req.files["bookFile"][0].originalname.split('.').pop(),
        });
        console.log("Book file uploaded to Cloudinary:", bookFileResult.secure_url);
        bookFileUrl = bookFileResult.secure_url;
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ error: "Failed to upload book file to Cloudinary" });
      }

      try {
        console.log("Uploading cover image to Cloudinary...");
        const coverImageResult = await cloudinary.uploader.upload(req.files["bookFile"][0].path, {
          folder: "book_covers",
          resource_type: "image",
          format: "png",
          public_id: `cover-${Date.now()}`,
        });
        console.log("Cover image uploaded to Cloudinary:", coverImageResult.secure_url);
        coverImageUrl = coverImageResult.secure_url;
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ error: "Failed to upload cover image to Cloudinary" });
      }

      const book = new Book({
        bookName,
        authorName: authorName || "Unknown",
        authorId: author._id,
        averageRating: averageRating || 0,
        ratings: ratings || 0,
        reviews: reviews || [],
        categoryName: categoryName || "Unknown",
        description: description || "",
        coverImage: coverImageUrl, // Use the resolved URL
        bookFile: bookFileUrl, // Use the resolved URL
        shelve: shelve || "Want To Read",
      });

      await book.save();
      console.log("Book saved successfully:", book);

      res.status(201).json({
        message: "Book created successfully",
        book: book,
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update a book's clicked count
exports.addclicked = async (req, res) => {
  try {
    const { bookId, userId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    book.clicked += 1;
    await book.save();
    res.status(200).json({ message: "Book clicked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// // Get all books
// exports.getAllBooks = async (req, res) => {
//   try {
//     const books = await Book.find();
//     res.status(200).json(books);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// Get all books with pagination
exports.getAllBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 books per page
    const skip = (page - 1) * limit;

    const books = await Book.find().skip(skip).limit(limit);
    const totalBooks = await Book.countDocuments(); // Get total number of books

    res.status(200).json({
      books,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
      currentPage: page,
    });
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
    const author = await Authors.findOne({ name: authorName });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Update fields
    book.bookName = bookName || book.bookName;
    book.authorName = authorName || book.authorName;
    book.authorId = author._id;
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
