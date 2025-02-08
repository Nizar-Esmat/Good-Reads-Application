const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;
require("dotenv").config();

const app = express();
app.use(express.json());

// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const bookRoutes = require("./routes/books"); 
const authorRoutes = require("./routes/authors"); 
const categoryRoutes = require("./routes/category"); 
const ratingRoutes = require("./routes/rating"); 
const reviewRoutes = require("./routes/review"); 
const shelveRoutes = require("./routes/shelve"); 

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/authors", authorRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shelves", shelveRoutes);
app.use(cors());



// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

