const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/Users");
const Subscription = require("./models/Subscription");
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
  const { userId, subscriptionType } = req.body; // بدلا من bookId

  const existingSubscription = await Subscription.findOne({ userId, status: "Premium" });
  if (existingSubscription) {
      return res.status(400).json({ error: "User already has an active subscription!" });
  }

  try {
    const authToken = await getAuthToken();
    
    const amountCents = subscriptionType === "monthly" ? 5000 : 50000; // سعر الاشتراك (مثلا)
    const orderId = await createOrder(authToken, amountCents, userId, subscriptionType);  
    const paymentKey = await getPaymentKey(authToken, orderId, amountCents, userId, subscriptionType);
    
    redirectToPaymentPage(res, paymentKey);
  } catch (error) {
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

app.post('/payment/notification', async (req, res) => {
  console.log("Webhook Received: ", req.body);
  const { type, obj } = req.body;

  if (type === 'TRANSACTION' && obj?.success) {
    try {
      let userId, subscriptionType;
      const transactionId = obj.id;
     
      if (obj.order && obj.order.merchant_order_id) {
        [userId, subscriptionType] = obj.order.merchant_order_id.split('-'); 
      }
    
      if (!userId || !subscriptionType) {
          return res.status(400).send("Invalid payment details");
      }

      // تحديث الاشتراك
      const startDate = new Date();
      const endDate = new Date();
      if (subscriptionType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      await Subscription.findOneAndUpdate(
        { userId },
        { status: "Premium", startDate, endDate, isActive: true },
        { upsert: true }
      );

      res.status(200).send("Payment success & Subscription activated!");
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
const subscriptionRoutes = require("./routes/subscription");




// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/authors", authorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/shelves", shelveRoutes);
app.use("/api/subscription", subscriptionRoutes);



app.use(cors());



// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

