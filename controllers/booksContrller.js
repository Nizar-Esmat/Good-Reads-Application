const Book = require("../models/Books");

// Create a new book (admin or author)
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
            shelve,
        } = req.body;
        const book = new Book({
            bookName:bookName,
            authorName: authorName,
            averageRating: averageRating || 0,
            ratings: ratings || 0,
            reviews: reviews || [],
            categoryName: categoryName || "Unknown",
            description: description || "",
            coverImage : coverImage || "",
            shelve: shelve || "Want To Read",
        });
        await book.save();
        res.status(201).json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Get a Book
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: "Book not found" });
        res.json(book);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

//Get all Books
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



// Update a Book (Author)
exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (req.user.role !== "admin") {
            return res.status(400).json({ message: "Access denied." });
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        res.json(updatedBook);
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

