const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewText: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
