const axios = require("axios");
const User = require("../models/Users");
const PurchasedBook = require("../models/PurchasedBook");  
const mongoose = require("mongoose");

require("dotenv").config();

// get auth_token
async function getAuthToken() {
  try {
    const response = await axios.post(
      "https://accept.paymob.com/api/auth/tokens",
      {
        api_key: process.env.PAYMOB_API_KEY,
      }
    );
    return response.data.token;
  } catch (error) {
    console.error("Error getting auth token:", error.response.data);
    throw error;
  }
}

//create order key
async function createOrder(authToken, amountCents, userId, bookId) {   
  try {
    const merchantOrderId = `${userId}-${bookId}`;
    const response = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
      }
    );
    return response.data.id;
  } catch (error) {
    console.error(
      "Error creating order:",
      error.response?.data || error.message
    );
  }
}

//get payment key
async function getPaymentKey(authToken, orderId, amountCents, userId, bookId,user) {
    try {

      const user = await User.findById(userId);
      if (!user) {
          throw new Error("User not found");
      }
      
      const response = await axios.post(
        "https://accept.paymob.com/api/acceptance/payment_keys",
        {
          auth_token: authToken,
          amount_cents: amountCents,
          expiration: 3600,
          order_id: orderId,
          billing_data: {
            first_name: user.name.split(" ")[0] || "User",
            last_name: user.name.split(" ")[1] || "User",
            email: user.email,
            phone_number: "01012345678",
            city: "Cairo",
            country: "EG",
          },
          currency: "EGP",
          integration_id: process.env.PAYMOB_INTEGRATION_ID,
          extra: {  
            userId: String(userId),
            bookId: String(bookId),
          }

        }
      );
      return response.data.token;
    } catch (error) {
      console.error(
        "Error getting payment key:",
        error.response?.data || error.message
      );
    }
  }
  
// for iframe
async function redirectToPaymentPage(res, paymentToken) {
  const iframeURL = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
  res.json({ iframeURL });
}


async function updatePurchasedBooks(userId, bookId,transactionId) {
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    const existingTransaction = await PurchasedBook.findOne({ transactionId });
    if (existingTransaction) {
      return { success: false, message: "Duplicate transaction detected" };
    }
    const existingPurchase = await PurchasedBook.findOne({
      userId: objectId,
      bookId: bookObjectId,
    });
    if (existingPurchase) {
      return { success: false, message: "Book already purchased" };
    }

    const newPurchase = new PurchasedBook({
      userId: objectId,
      bookId: bookObjectId,
      transactionId,
    });
    await newPurchase.save();

    return { success: true, purchase: newPurchase };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAuthToken,
  createOrder,
  getPaymentKey,
  redirectToPaymentPage,
  updatePurchasedBooks,
};
