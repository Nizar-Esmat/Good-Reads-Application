const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    bookName: { type: String, required: true },
    authorName: { type: String, required: true },
    averageRating: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    reviews: [{ type: String }],
    categoryName: { type: String },
    description: { type: String },
    coverImage: { type: String },
    bookFile: { type: String },
    shelve: { type: String, enum: ['Read', 'Currently Reading', 'Want To Read'], default: 'Want To Read' },
});

module.exports = mongoose.model('Book', BookSchema);