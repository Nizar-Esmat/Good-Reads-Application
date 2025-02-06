const Book = require("../models/Books");

// Create a new book (admin )
exports.createBook = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
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
        } = req.body;

        const existingBook = await Book.findOne({ bookName, authorName });
        if (existingBook) {
            return res.status(400).json({ message: "This book already exists" });
        }

        const book = new Book({
            bookName:bookName,
            authorName: authorName,
            averageRating: averageRating || 0,
            ratings: ratings || 0,
            reviews: reviews || [],
            categoryName: categoryName || "Unknown",
            description: description || "",
            coverImage : coverImage || "",
        });
        await book.save();
        res.status(201).json({message: "Book created successfully",book});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get a Book by id
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

//Get all Books (with pagination  // ?page=1&limit=3)
exports.getAllBooks = async (req, res) => {
    try {
        let { page, limit ,search } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const skip = (page - 1) * limit;
        const searchQuery = search ? { bookName: { $regex: search, $options: "i" } } : {};
        const books = await Book.find(searchQuery).skip(skip).limit(limit);
        const totalBooks = await Book.countDocuments(searchQuery);

        res.json({
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
            currentPage: page,
            books
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



// Update a Book (Admin)
exports.updateBook = async (req, res) => {
    try {
       
        if (req.user.role !== "admin") {
            return res.status(400).json({ message: "Access denied." });
        }

        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: "Book not found." });
        }
        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        res.json({
            message: "Book updated successfully!",
            book: updatedBook
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a book(Admin)
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);

        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied: You are not the author of this book",
            });
        }
        await Book.findByIdAndDelete(req.params.id);
        res.json({ message: "Book deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

