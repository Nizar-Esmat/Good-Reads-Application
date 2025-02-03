const express = require("express");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const app = express();
app.use(express.json());

// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const bookRoutes = require("./routes/books"); 
const authorRoutes = require("./routes/authors"); 


// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/authors", authorRoutes);

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

