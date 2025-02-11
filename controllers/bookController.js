const Book = require("../models/Books");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const Authors = require("../models/Authors");
const Category = require("../models/Category");

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
      return res.status(403).json({ message: "Access denied" });
    }
    upload(req, res, async (err) => {
      if (err) {
        console.error("Multer Error:", err);
        return res.status(400).json({ error: err.message });
      }

      const {
        bookName,
        authorId,
        averageRating,
        ratings,
        reviews,
        categoryId,
        description,
        shelve,
      } = req.body;

      const existingBook = await Book.findOne({ bookName });
      if (existingBook) {
        return res.status(400).json({ message: "Book already exists" });
      }

      if (!authorId) {
        return res.status(400).json({ message: "Author ID is required" });
      }

      if (!categoryId) {
        return res.status(400).json({ message: "Category ID is required" });
      }

      // Corrected queries
      let author = await Authors.findById(authorId); // Use findById directly
      let categories = await Category.findById(categoryId); // Use findById directly

      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }

      if (!categories) {
        return res.status(404).json({ message: "Category not found" });
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
        authorName: author.authorName || "Unknown",
        authorId: author._id,
        categoryId: categories._id,
        averageRating: averageRating || 0,
        ratings: ratings || 0,
        reviews: reviews || [],
        categoryName: categories.categoryName || "Unknown",
        description: description || "",
        coverImage: coverImageUrl, // Use the resolved URL
        bookFile: bookFileUrl, // Use the resolved URL
        shelve: shelve || "Want To Read",
      });

      await book.save();
      console.log("Book saved successfully:", book);
      // add the book to auther
      author.books.push({ bookId: book._id });
      await author.save();

      //add the book to category
      categories.books.push({ bookId: book._id });
      await categories.save();

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

//get all books
exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = search ? { bookName: { $regex: search, $options: "i" } } : {};

    const books = await Book.find(query).populate('authorId').populate('categoryId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limit);

    res.status(200).json({ array: books, total: totalBooks, totalPages, currentPage: page });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get a book by ID
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('authorId');
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({ message: "Book content is here!", book })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// // Get a book by name
// exports.getBookByName = async (req, res) => {
//   try {
//     const { name } = req.params;

//     // Use case-insensitive regex for partial matching
//     const book = await Book.findOne({ bookName: { $regex: new RegExp(name, "i") } });

//     if (!book) {
//       return res.status(404).json({ message: "Book not found" });
//     }

//     res.status(200).json(book);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


// Update a book
exports.updateBook = async (req, res) => {
  try {
    const { bookName, averageRating, ratings, reviews, categoryId, description, shelve } = req.body;
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    let categories = await Category.findOne({ categoryId });

    // Update fields    
    book.bookName = bookName || book.bookName;
    book.averageRating = averageRating || book.averageRating;
    book.ratings = ratings || book.ratings;
    book.reviews = reviews || book.reviews;
    book.categoryName = categories.categoryName || book.categoryName;
    book.description = description || book.description;

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
// search
exports.getBookByName = async (req, res) => {
  try {
    const { bookName } = req.params;
    const book = await Book.findOne({ bookName: { $regex: new RegExp(bookName, "i") } })

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json({ message: "Book found successfully", book });

  } catch (err) {
    console.error("Error fetching book by name:", err);
    res.status(500).json({ message: "Error fetching book by name", error: err.message });
  }
}


// Export the upload middleware
exports.upload = multer();
