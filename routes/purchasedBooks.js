const express = require("express");
const router = express.Router();


const{
    purchaseBook,
    getPurchasedBooks,
    hasPurchasedBook,
}=require("../controllers/purchasedBooksController");


router.post("/",purchaseBook);

router.get("/:userId", getPurchasedBooks);

router.get("/:userId/:bookId", hasPurchasedBook);

module.exports = router;
