const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
categoryName: { type: String, required: true },
description:  { type: String, required: true },
  books: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
    },
  ],
  coverImage: { type: String },
});

module.exports = mongoose.model("Category", CategorySchema);
