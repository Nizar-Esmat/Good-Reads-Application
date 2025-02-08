const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/Users");
const { getAuthToken,updatePurchasedBooks } = require('./controllers/paymentController');
const PORT = process.env.PORT || 3000;
require("dotenv").config();

const app = express();
app.use(express.json());

// auth_tokem paymob
const API_KEY = process.env.PAYMOB_API_KEY;
app.get('/paymob/token', async (req, res) => {
  try {
      const authToken = await getAuthToken(API_KEY);
      res.json({ token: authToken });
  } catch (error) {
      res.status(500).json({ error: 'Failed to get auth token' });
  }
});

app.post('/payment', async (req, res) => {
  const { userId, bookId,amountCents } = req.body;

  const existingPurchase = await PurchasedBook.findOne({ userId, bookId });
        if (existingPurchase) {
            return res.status(400).json({ error: "You have already purchased this book!" });
        }

  try {
    const authToken = await getAuthToken();
    const orderId = await createOrder(authToken,amountCents,userId, bookId);
    const paymentKey = await getPaymentKey(authToken, orderId,amountCents,userId, bookId);
    
    redirectToPaymentPage( res,paymentKey);
  } catch (error) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

app.post('/payment/notification', async (req, res) => {
  console.log("Webhook Received: ", req.body);
  const { type, obj } = req.body;
  if (type === 'TRANSACTION' && obj?.success) {
    try {
      let userId, bookId;
      const transactionId = obj.id;
     
      if (obj.order && obj.order.merchant_order_id) {
        [userId, bookId] = obj.order.merchant_order_id.split('-'); 
      }
    
        if (!userId || !bookId) {
          return res.status(400).send("Invalid payment details");
      }

      const result = await updatePurchasedBooks(userId, bookId,transactionId);
      if (result.success) {
          res.status(200).send("Payment success & Book purchased!");
      } else {
          res.status(400).send(result.message);
      }
  } catch (error) {
      res.status(500).send("Internal Server Error");
  }
  } else {
      res.status(400).send("Payment failed");
  }
});


// Connect to MongoDB

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
const purchasedBooksRoutes = require("./routes/purchasedBooks");




// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shelves", shelveRoutes);
app.use("/api/purchase-book", purchasedBooksRoutes);



app.use(cors());



// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

