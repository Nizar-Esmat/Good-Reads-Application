const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
    bookName: { type: String, required: true },
    authorId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Author' },
    averageRating: { type: Number, default: 0 },
    ratings: { type: Number, default: 0 },
    reviews: [{ type: String }],
    categoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    description: { type: String },
    coverImage: { type: String },
    bookFile: { type: String },
    clicked : {type :Number , default : 0 },
    shelve: { type: String, enum: ['Read', 'Currently Reading', 'Want To Read'], default: 'Want To Read' },
});

module.exports = mongoose.model('Book', BookSchema);