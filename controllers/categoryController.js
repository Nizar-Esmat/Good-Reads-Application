  const Category = require('../models/Category');
  const mongoose = require("mongoose");
  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");
  const multer = require("multer");
  const Books = require('../models/Books');
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Set up Multer storage for category cover images
  const coverImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "category_covers", // Folder for category cover images
      format: async (req, file) => "png", // Default format
      public_id: (req, file) => `cover-${Date.now()}`, // Unique public ID
      resource_type: "image", // Explicitly set resource_type to "image"
    },
  });
  
  // Create Multer upload middleware for cover images
  const uploadCoverImage = multer({ storage: coverImageStorage });
  
  // Export the upload middleware for use in routes
  exports.uploadCoverImage = uploadCoverImage.single("coverImage");


// Create a new category (admin )
exports.createCategory = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { categoryName, description } = req.body;

    // Validate required fields
    if (!categoryName || !description) {
      return res.status(400).json({ message: "categoryName and description are required" });
    }

    // Check if the category already exists
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res.status(400).json({ message: "This category already exists" });
    }

    // Upload cover image to Cloudinary if a file is provided
    const DEFAULT_PROFILE_PICTURE =
      "https://res.cloudinary.com/dqmnyaqev/image/upload/v1739210735/user_avatars/avatar-1739210734375.png";
    let coverImageUrl = "";
    if (req.file) {
      try {
        const coverImageResult = await cloudinary.uploader.upload(req.file.path, {
          folder: "category_covers",
          resource_type: "image",
        });
        coverImageUrl = coverImageResult.secure_url;
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ message: "Failed to upload cover image to Cloudinary" });
      }
    }else{
      coverImageUrl = DEFAULT_PROFILE_PICTURE;
    }

    // Create a new category
    const category = new Category({
      categoryName,
      description,
      coverImage: coverImageUrl, // Use the Cloudinary URL for the cover image
      books: [], // Initialize an empty array for books
    });

    // Save the category to the database
    await category.save();

    // Send the response
    res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    console.error("Error creating category:", err);
    res.status(500).json({ message: "Error creating category", error: err.message });
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
          return res
            .status(400)
            .json({ message: `Book with ID ${book.bookId} does not exist` });
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
    const category = await Category.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json({ message: "Category updated successfully", category });
  } catch (err) {
    res.status(500).json({ message: "Error updating category" });
  }
};

// Get a Category by id
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('books.bookId');
    if (!category)
      return res.status(404).json({ message: "Category not found" });
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

    const categories = await Category.find(searchQuery).skip(skip).limit(limit).populate('books.bookId');
    const totalCategories = await Category.countDocuments(searchQuery);

    const totalPages = Math.ceil(totalCategories / limit);

    res.json({
      total: totalCategories,
      totalPages,
      currentPage: page,
      array: categories,
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
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const booksWithCategory = await Books.find({ categoryID: category._id });

    const deletedBookNames = booksWithCategory.map(book => book.bookName);

    await Books.deleteMany({ categoryID: category._id });

    res.json({
      message: "Category and associated books deleted successfully",
      deletedCategory: category.categoryName, 
      deletedBooks: deletedBookNames,
    });
  } catch (err) {
    console.error("Error deleting category and associated books:", err);
    res.status(500).json({ message: "Error deleting category and associated books" });
  }
};