const { default: mongoose } = require("mongoose");
const Shelve = require("../models/Shelve");
const Users = require("../models/Users");

//add book to shelve
exports.addToShelve = async (req, res) => {
  try {
    const { bookId, userId, shelve } = req.body;
    const validShelves = ["Read", "Currently Reading", "Want To Read"];

    if (!validShelves.includes(shelve)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid shelve value. It should be 'Read', 'Currently Reading' or 'Want To Read'.",
        });
    }

    const existingBook = await Shelve.findOne({ bookId, userId });
    if (existingBook) {
      return res
        .status(400)
        .json({ message: "Book already exists in the shelve" });
    }

    const newShelve = new Shelve({ bookId, userId, shelve });
    await newShelve.save();

    res.status(201).json({ message: "Book added to shelve successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding book to shelve", error: err.message });
  }
};

//update status of book
exports.updateShelve = async (req, res) => {
  try {
    const { bookId, userId, shelve } = req.body;
    const validShelves = ["Read", "Currently Reading", "Want To Read"];

    if (!validShelves.includes(shelve)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid shelve value. It should be 'Read', 'Currently Reading' or 'Want To Read'.",
        });
    }

    const bookShelve = await Shelve.findOneAndUpdate(
      { bookId, userId },
      { shelve },
      { new: true }
    );

    if (!bookShelve) {
      return res
        .status(404)
        .json({ message: "Book not found in user's shelve" });
    }

    res
      .status(200)
      .json({ message: "Shelve updated successfully", bookShelve });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating shelve", error: err.message });
  }
};

//get book
exports.getBooksByShelve = async (req, res) => {
  try {
    const { shelve, userId } = req.params;
    const validShelves = ["Read", "Currently Reading", "Want To Read"];

    if (!validShelves.includes(shelve)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid shelve value. It should be 'Read', 'Currently Reading' or 'Want To Read'.",
        });
    }

    const booksInShelve = await Shelve.find({ userId, shelve }).populate(
      "bookId",
      "bookName authorName coverImage shelve"
    );

    if (booksInShelve.length === 0) {
      return res.status(404).json({ message: "No books found in this shelve" });
    }

    res.status(200).json({ books: booksInShelve });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching books by shelve", error: err.message });
  }
};

//get all shlves for spscific user
exports.getAllShelvesForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const shelves = await Shelve.find({ userId });
    if (shelves.length === 0) {
      return res
        .status(404)
        .json({ message: "No shelves found for this user" });
    }

    res.status(200).json({ shelves });
  } catch (err) {
    console.error("Error fetching shelves for user", err);
    res
      .status(500)
      .json({ message: "Error fetching shelves", error: err.message });
  }
};


//delete shelve
exports.deleteShelve = async (req, res) => {
  try {
    const { bookId, userId } = req.params;
    const deletedShelve = await Shelve.findOneAndDelete({ bookId, userId });
    if (!deletedShelve) {
      return res.status(404).json({ message: "Shelve not found" });
    }
    res.status(200).json({ message: "Shelve deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting shelve", error: err.message });
  }
}