const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

const{
    createCategory,
    addBooksToCategory,
    updateCategory,
    getAllCategories,
    deleteCategory
}=require("../controllers/categoryController");

router.post("/", auth,createCategory); 
router.post("/add-books", auth,addBooksToCategory); 
router.put("/:id", auth,updateCategory);
router.get("/",getAllCategories); 
router.delete("/:id", auth,deleteCategory);

module.exports = router;
