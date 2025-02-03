const mongoose = require("mongoose");

const AuthorSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  dateOfBirth: { type: Date },
  books: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
      title: { type: String, required: true },
    },
  ],
  bio: { type: String, default: "" },
  avatar: { type: String},
});

module.exports = mongoose.model("Author", AuthorSchema);
