const PurchasedBook = require("../models/PurchasedBook");

exports.purchaseBook = async (req, res) => {
    const { userId, bookId } = req.body;

    try {
        const existingPurchase = await PurchasedBook.findOne({ userId, bookId });
        if (existingPurchase) {
            return res.status(400).json({ message: "You've already purchased this book!" });
        }

        const newPurchase = new PurchasedBook({ userId, bookId });
        await newPurchase.save();

        res.status(201).json({ message: "Book purchased successfully!", purchase: newPurchase });
    } catch (err) {
        res.status(500).json({ message: "Error purchasing book", error: err.message });
    }
};


exports.getPurchasedBooks = async (req, res) => {
    const { userId } = req.params;

    try {
        const purchases = await PurchasedBook.find({ userId }).populate({ path: "bookId",
            select: "title author price"});
        res.status(200).json({ purchasedBooks: purchases });
    } catch (err) {
        res.status(500).json({ message: "Error fetching purchased books", error: err.message });
    }
};


exports.hasPurchasedBook = async (req, res) => {
    const { userId, bookId } = req.params;

    try {
        const purchase = await PurchasedBook.findOne({ userId, bookId });
        res.status(200).json({ hasAccess: !!purchase });
    } catch (err) {
        res.status(500).json({ message: "Error checking book purchase", error: err.message });
    }
};
