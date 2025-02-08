const PurchasedBook = require("../models/PurchasedBook");

module.exports = async (req, res, next) => {
    const { userId, requestedPages } = req.query; 
    const { id: bookId } = req.params; 

    try {
        if (requestedPages <= 10) {
            return next();
        }

        const purchasedBook = await PurchasedBook.findOne({ userId, bookId });

        if (!purchasedBook) {
            return res.status(403).json({ message: "You can only read the first 10 pages for free. Please purchase the book to access the full content." });
        }

        next(); 
    } catch (error) {
        res.status(500).json({ message: "Error checking book purchase status", error: error.message });
    }
};
