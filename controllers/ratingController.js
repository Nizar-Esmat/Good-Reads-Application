const Rating = require("../models/Ratings");
const Book = require("../models/Books");
const mongoose = require("mongoose");

// Create a new Rating
exports.createRatingOrUpdate = async (req, res) => {
  try {
    const { bookId, userId, rating } = req.body;
    const ratingNumber = parseFloat(rating);
    if (isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }
    let existingRating = await Rating.findOne({ bookId, userId });
    if (existingRating) {
      existingRating.rating = ratingNumber;
      await existingRating.save();
      res.status(200).json({ message: "reating updated successfully" });
    } else {
      await Rating.create({ bookId, userId, rating });
      res.status(201).json({ message: "reating created successfully" });
    }
    await updateBookAverageRating(bookId);
  } catch (err) {
    res.status(500).json({ message: "Error creating or updating Rating",error: err.message  });
  }
};
const updateBookAverageRating = async (bookId) => {
    try {
        const ratings = await Rating.aggregate([
            { $match: { bookId:new  mongoose.Types.ObjectId(bookId) } },
            { $group: { _id: "$bookId", averageRating: { $avg: "$rating" }, totalRatings: { $sum: 1 } } }
          ]);
          if (ratings.length === 0) {
            await Book.findByIdAndUpdate(bookId, { averageRating: 0, ratings: 0 });
          } else {
            const { averageRating, totalRatings } = ratings[0];
            await Book.findByIdAndUpdate(bookId, { averageRating, ratings: totalRatings });
          }
  
     
    } catch (err) {
      console.error("Error updating book average rating:", err);
    }
  };

// calculate avg ratings
exports.calculateAverageRating = async (req, res) => {
  try {
    const {bookId}=req.params;
    
     ratings = await Rating.aggregate([
        { $match: { bookId:new  mongoose.Types.ObjectId(bookId) } }, 
        { $group: { _id: "$bookId", averageRating: { $avg: "$rating" } } }, 
      ])
    if (ratings.length === 0) {
        return res.json({ averageRating: null });
}
return res.json({ averageRating: ratings[0].averageRating });
   
  
  } catch (err) {
    return res.status(500).json({ message: "Error calculating average rating", error: err.message });
  }
};


// Get User Rating for a Book
exports.getUserRating = async (req, res) => {
  try {
      const { bookId, userId } = req.params;

      const rating = await Rating.findOne({ bookId, userId });

      if (!rating) {
          return res.status(404).json({ message: "No rating found for this user on this book" });
      }

      res.json({ rating: rating.rating });
  } catch (error) {
      res.status(500).json({ message: "Error fetching user rating", error: error.message });
  }
};


//delete rating by user
exports.deleteRating = async (req, res) => {
    try {
        const { bookId, userId } = req.params;

        const rating = await Rating.findOne({ bookId, userId });

        if (!rating) {
            return res.status(404).json({ message: "Rating not found" });
        }

        await Rating.findOneAndDelete({ bookId, userId });
        await updateBookAverageRating(bookId);
        res.json({ message: "Rating deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting rating", error });
    }
};



