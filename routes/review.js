const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

const{
    createReview,
    getReviews,
    updateReview,
    deleteReview
}=require("../controllers/reviewController");


router.post("/", auth,createReview); 
router.get("/:bookId", getReviews); 
router.put('/:bookId/:reviewId', updateReview);
router.delete("/:bookId/:reviewId", auth,deleteReview); 


module.exports = router;
