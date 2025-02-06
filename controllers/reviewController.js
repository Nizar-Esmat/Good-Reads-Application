const Review = require("../models/Reviews");
const Rating = require("../models/Ratings");
const { calculateAverageRating } = require("./ratingController");
const mongoose = require("mongoose");

const calculateAvgRating = async (bookId) => {
    try {
        const ratings = await Rating.find({ bookId });

        if (ratings.length === 0) return 0;
        const totalRatingSum = ratings.reduce((sum, rating) => sum + rating.rating, 0);
        return totalRatingSum / ratings.length;

    } catch (err) {
        console.error("Error calculating average rating:", err);
    }
};
// create new review
exports.createReview= async (req, res) => {
    try {
        const { bookId, userId, reviewText } = req.body;
        const bookExists = await mongoose.model("Book").findById(bookId);
        if (!bookExists) {
            return res.status(404).json({ message: "Book not found" });
        }

        const userExists = await mongoose.model("User").findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "User not found" });
        }
        const newReview =await Review.create({ bookId, userId, reviewText });
        bookExists.reviews.push(reviewText);
        await bookExists.save();
        res.status(201).json({ message: "Review Created Successfully"});
    } catch (err) {
        res.status(500).json({ message: "Error creating Review", error: err.message });
    }
};

//get reviews
exports.getReviews= async (req, res) => {
    try {
        const { bookId } = req.params;

        if (!bookId || !mongoose.isValidObjectId(bookId)) {
            return res.status(400).json({ message: "Invalid bookId" });
          }

        const reviews = await Review.find({ bookId })
        .populate("userId", "name") .sort({ date: -1 });
        
        const ratings = await Rating.find({ bookId })
        .populate("userId", "name");

        const averageRatingResult = await calculateAvgRating(bookId);
       
        return res.json({
            bookId,
            averageRating: averageRatingResult||0,
            totalRatings: ratings.length,
            ratings,
            reviews
        });
    } catch (err) {
        return res.status(500).json({ message: "Error fetching Reviews", error: err.message });
    }
};

//update review
exports.updateReview = async (req, res) => {
    try {
      const { bookId, reviewId } = req.params;
      const { reviewText } = req.body;
      const review = await Review.findOne({ bookId, _id: reviewId });
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      review.reviewText = reviewText;
      await review.save();
      res.json({ message: "Review updated successfully", review });
  } catch (err) {
    res.status(500).json({ message: "Error updating review", error: err.message });
  }
};

//delete review
exports.deleteReview=async (req, res) => {
    try {
        const { bookId, reviewId } = req.params;

       
        const review = await Review.findOne({ bookId, _id: reviewId });
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const book = await mongoose.model("Book").findById(bookId);
        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        
        book.reviews.pull(reviewId);
        await book.save();

        await Review.findOneAndDelete({ bookId, _id: reviewId });
        res.json({ message:" Review deleted" });
    } catch (error) {
        res.status(500).json({ message:"Error deleting review", error });
    }
};
