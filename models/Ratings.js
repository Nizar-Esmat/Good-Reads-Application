const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true }, 
    rating: { type: Number, required: true, min: 1, max: 5 }
});

module.exports = mongoose.model("Rating", RatingSchema);
