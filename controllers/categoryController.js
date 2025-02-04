const Category = require('../models/Category');
const Book = require("../models/Books");
const mongoose = require("mongoose");

// Create a new category (admin )
exports.createCategory=async(req,res)=>{
    try{
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const{ categoryName,description,coverImage}=req.body;
        
        
        const existingCategry = await Category.findOne({ categoryName });
        if (existingCategry) {
            return res.status(400).json({ message: "This categry already exists" });
        }

        if (!categoryName || !description) {
            return res.status(400).json({ message: "categoryName and description are required" });
        }

        const category = new Category({
            categoryName:categoryName,
            description:description,
            coverImage:coverImage,
            books:[],
          });
        await category.save();
        res.status(201).json({message: "category created successfully",category});
    }
    catch (err) {
        res.status(500).json({ message: "Error creating category" });
    }
};

// add book to category (admin )
exports.addBooksToCategory = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
      const { categoryId, books } = req.body;
  
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const validBooks = [];
      for (const book of books) {
        if (book.bookId && mongoose.Types.ObjectId.isValid(book.bookId)) {
          const existingBook = await Book.findById(book.bookId);
          if (!existingBook) {
            return res.status(400).json({ message: `Book with ID ${book.bookId} does not exist` });
          }
          validBooks.push({ bookId: new mongoose.Types.ObjectId(book.bookId) });
        } else {
          return res.status(400).json({ message: "Invalid book ID format" });
        }
      }
  
      category.books.push(...validBooks);
      await category.save();
  
      res.status(200).json({ message: "Books added successfully", category });
  
    } catch (err) {
      res.status(500).json({ message: "Error adding books", error: err.message });
    }
  };

  //update category
  exports.updateCategory = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
      const { id } = req.params;
      const updatedData = req.body;
      const category = await Category.findByIdAndUpdate(id, updatedData, { new: true });

      if (!category) 
        return res.status(404).json({ message: "Category not found" });

      res.json({message: "Category updated successfully",category});
    } catch (err) {
      res.status(500).json({ message: "Error updating category" });
    }
  };

  // Get a Category by id
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

  
  //Get all Categories 
  exports.getAllCategories = async (req, res) => {
    try {
        let { page, limit, search } = req.query;
        page = parseInt(page) || 1;
        limit = parseInt(limit) || 10;

        const skip = (page - 1) * limit;

        let searchQuery = {};
        if (search) {
          searchQuery = {
            categoryName: { $regex: search, $options: "i" }, 
          };
        }

      const categories = await Category.find(searchQuery).skip(skip)
      .limit(limit);
      const totalCategories = await Category.countDocuments(searchQuery);
    
      const totalPages = Math.ceil(totalCategories / limit);
    
      res.json({
        totalCategories,
        totalPages,
        currentPage: page,
        categories,
      });
    } catch (err) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  };
  
  //delete category
 exports.deleteCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByIdAndDelete(id);
      if (!category) return res.status(404).json({ message: "Category not found" });
      res.json({ message: "Category deleted" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting category" });
    }
  };
