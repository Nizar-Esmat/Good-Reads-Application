const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

const{
    createRatingOrUpdate,
    calculateAverageRating,
    deleteRating
}=require("../controllers/ratingController");


router.post("/", auth,createRatingOrUpdate); 
router.get("/average-rating/:bookId", calculateAverageRating);
router.delete("/:bookId/:userId", auth,deleteRating); 
module.exports = router;
