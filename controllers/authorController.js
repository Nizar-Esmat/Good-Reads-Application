const Author  = require("../models/Authors");
const Book = require("../models/Books");
const mongoose = require("mongoose");

// Create a new author (admin )
exports.createAuthor = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }
    const { authorName, dateOfBirth, books, bio, imageUrl } = req.body;

    const existingAuthor = await Author.findOne({ authorName });
    if (existingAuthor) {
      return res.status(400).json({ message: "Author already exists" });
    }

    const validBooks = books.map(book => {
        let bookId = null;
        if (book.bookId && mongoose.Types.ObjectId.isValid(book.bookId)) {
            bookId = new mongoose.Types.ObjectId(book.bookId);
          }
          return {
            bookId: bookId,
            title: book.title
          };
        });
    const author = new Author({
      authorName: authorName,
      dateOfBirth: dateOfBirth,
      books: validBooks|| [],
      bio: bio || "",  
      imageUrl: imageUrl || "" 
    });
    await author.save();
    res.status(201).json(author);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Get all authors(?search=)
exports.getAllAuthors = async (req, res) => {
    try {
        const { page = 1, limit = 10 , search = ""} = req.query;
        const query = search ? { authorName: { $regex: search, $options: "i" } } : {};

        const authors = await Author.find(query)
        .populate("books.bookId").limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));
        const totalAuthors = await Author.countDocuments(query);
        res.json({
            totalPages: Math.ceil(totalAuthors / Number(limit)),
            currentPage: Number(page),
            authors,
          });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//Get author by id
exports.getAuthorById = async (req, res) => {
    try {
        const author = await Author.findById(req.params.id).populate("books.bookId");
        if (!author) return res.status(404).json({ message: "Author not found" });
        res.json(author);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

//add book to author
exports.addBookToAuthor = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
    }

    const { authorId } = req.params;
    const { bookId, title } = req.body;
    
    const bookExists = await Book.findById(bookId);
    if (!bookExists) {
      return res.status(404).json({ message: "Book not found" });
    }

    const author = await Author.findById(authorId);
    if (!author) {
      return res.status(404).json({ message: "Author not found" });
    }

    const isBookAlreadyAdded = author.books.some(book => book.bookId.toString() === bookId);
    if (isBookAlreadyAdded) {
      return res.status(400).json({ message: "Book already added to author" });
    }

    if (bookExists && bookExists._id) {
        author.books.push({ bookId: bookExists._id, title });
    }
   
    await author.save();

    res.json({
        message: "Book added to author successfully",
        author: author,
    });
   
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update author (Admin)
exports.updateAuthor = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(400).json({ message: "Access denied." });
        }

        const { bio, imageUrl, authorName, dateOfBirth } = req.body;
        

        const author = await Author.findById(req.params.id);
        if (!author) {
          return res.status(404).json({ message: "Author not found" });
        }

        if (authorName) author.authorName = authorName;
        if (dateOfBirth) author.dateOfBirth = dateOfBirth;
        if (bio) author.bio = bio;
        if (imageUrl) author.imageUrl = imageUrl;
    
        await author.save();
    
        res.json({
            message: "Author updated successfully",
            author: author,
          });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete specific book from author(Admin)
exports.deleteBookFromAuthor = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
      const { authorId, bookId } = req.params;
      const updatedAuthor = await Author.findByIdAndUpdate(
        authorId,
        { $pull: { books: { bookId: bookId } } },
        { new: true }
      );
  
      if (!updatedAuthor) {
        return res.status(404).json({ message: "Author not found" });
      }
  
      res.json({
        message: "Book removed from author successfully",
        author: updatedAuthor
    });

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }; 

// Delete author (Admin)
exports.deleteAuthor = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(400).json({ message: "Access denied." });
        }

        await Author.findByIdAndDelete(req.params.id);
        res.json({ message: "Author deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
