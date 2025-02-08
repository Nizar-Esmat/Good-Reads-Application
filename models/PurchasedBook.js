const mongoose = require("mongoose");

const PurchasedBookSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    transactionId: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PurchasedBook", PurchasedBookSchema);
