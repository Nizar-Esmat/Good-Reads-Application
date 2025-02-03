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
  imageUrl: { type: String, default: "" },
});

module.exports = mongoose.model("Author", AuthorSchema);
