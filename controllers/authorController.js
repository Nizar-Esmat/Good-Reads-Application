const Author = require("../models/Authors");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Books = require("../models/Books");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'author_avatars', // Folder in Cloudinary
    format: async (req, file) => 'png', // Default format
    public_id: (req, file) => `avatar-${Date.now()}`, // Unique public ID
  },
});
// Initialize Multer with the Cloudinary storage
const upload = multer({ storage: storage });
exports.upload = upload;
// Create a new author (admin only)
exports.createAuthor = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Extract fields from the request body
    const { authorName, dateOfBirth, books, bio } = req.body;

    // Check if the author already exists
    const existingAuthor = await Author.findOne({ authorName });
    if (existingAuthor) {
      return res.status(400).json({ message: "Author already exists" });
    }

    // Validate the books array
    if (books) {
      const validBooks = books.map(book => {
        let bookId = null;
        if (book.bookId && mongoose.Types.ObjectId.isValid(book.bookId)) {
          bookId = new mongoose.Types.ObjectId(book.bookId);
        }
        return {
          bookId: bookId,
        };
      });
    } else {
      validBooks = [];
    }

    const DEFAULT_PROFILE_PICTURE =
    "https://res.cloudinary.com/dqmnyaqev/image/upload/v1739210735/user_avatars/avatar-1739210734375.png";

    const avatar = req.file ? req.file.path : DEFAULT_PROFILE_PICTURE
    // Create the author object
    const author = new Author({
      authorName: authorName,
      dateOfBirth: dateOfBirth,
      books: validBooks || [],
      bio: bio || "",
      avatar
    });

    // Save the author to the database
    await author.save();

    // Send the response
    res.status(201).json({
      message: "Author created successfully",
      author: author,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//update author clicked count


// Get all authors
exports.getAllAuthors = async (req, res) => {
  try {
    const { page = 1, limit = 10, noPagination = false, search = '' } = req.query;

    let authors;
    let totalAuthors;
    const searchQuery = search ? { authorName: { $regex: search, $options: 'i' } } : {};

    //get all authors without pagination
    if (noPagination === 'true') {
      authors = await Author.find(searchQuery).select('_id authorName');
      totalAuthors = authors.length;
    } else {
      authors = await Author.find(searchQuery)
        .populate('books.bookId')
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      totalAuthors = await Author.countDocuments(searchQuery);
    }

    res.status(200).json({
      array: authors,
      totalPages: noPagination === 'true' ? 1 : Math.ceil(totalAuthors / limit),
      currentPage: noPagination === 'true' ? 1 : parseInt(page),
      total: totalAuthors,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get an author by ID
exports.getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id).populate('books.bookId');
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }
    res.status(200).json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAuthorByName = async (req, res) => {
  try {
    const { name } = req.params;
    const author = await Author.findOne({ authorName: name });

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.status(200).json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a book to an author
exports.addBookToAuthor = async (req, res) => {
  try {
    const { bookId } = req.body;
    const author = await Author.findById(req.params.authorId);
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    author.books.push({ bookId });
    await author.save();

    res.status(200).json({
      message: "Book added to author successfully",
      author: author,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an author
exports.updateAuthor = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log the request body
    console.log("Request Params:", req.params); // Log the request params
    console.log("Request File:", req.file); // Log the uploaded file (if any)

    const { authorName, dateOfBirth, bio } = req.body;

    // Find the author by ID
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    // Update author fields if provided
    if (authorName) author.authorName = authorName;
    if (dateOfBirth) author.dateOfBirth = dateOfBirth;
    if (bio) author.bio = bio;

    // Upload new avatar to Cloudinary if a file is provided
    if (req.file) {
      try {
        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "author_avatars", // Folder in Cloudinary
          resource_type: "image", // Ensure it's treated as an image
        });
        author.avatar = result.secure_url; // Use the Cloudinary URL for the avatar
      } catch (error) {
        console.error("Cloudinary Upload Error Details:", error.message); // Log the error details
        return res.status(500).json({ error: "Failed to upload avatar to Cloudinary", details: error.message });
      }
    }

    // Save the updated author
    await author.save();

    // Send the updated author as a response
    res.status(200).json({
      message: "Author updated successfully",
      author: author,
    });
  } catch (err) {
    console.error("Error updating author:", err); // Log the error
    res.status(500).json({ error: err.message });
  }
};

// Delete a book from an author
exports.deleteBookFromAuthor = async (req, res) => {
  try {
    const author = await Author.findById(req.params.authorId);
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    author.books = author.books.filter(
      (book) => book.bookId.toString() !== req.params.bookId
    );

    await author.save();

    res.status(200).json({
      message: "Book deleted from author successfully",
      author: author,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an author
exports.deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const bookIds = author.books.map(book => book.bookId);

    const books = await Books.find(
      { _id: { $in: bookIds } },  
      { bookName: 1, _id: 0 }     
    );

    const deletedBookNames = books.map(book => book.bookName);

    await Books.deleteMany({ _id: { $in: bookIds } });

    await Author.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Author and associated books deleted successfully",
      deletedAuthor: author.name,
      deletedBooks: deletedBookNames, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
exports.getAuthorByName = async (req, res) => {
  try {
    const { name } = req.params;
    const author = await Author.findOne({ authorName: name });

    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    res.status(200).json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

