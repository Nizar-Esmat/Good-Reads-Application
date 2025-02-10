const axios = require("axios");
const User = require("../models/Users");
const Book = require("../models/Books");
const Subscription = require("../models/Subscription");
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
async function createOrder(authToken, userId, planType) {
  try {
    const amountCents = planType === "monthly" ? 5000 : 50000;
    const merchantOrderId = `${userId}-${planType}`;
    const response = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders",
      {
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: "EGP",
        merchant_order_id: merchantOrderId,
        items: [],
      }
    );

    return response.data.id;
  } catch (error) {
    console.error(
      "Error creating subscription order:",
      error.response?.data || error.message
    );
    throw error;
  }
}

//get payment key
async function getPaymentKey(authToken, orderId, userId, planType) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const amountCents = planType === "monthly" ? 5000 : 50000;
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
        extra: { userId: String(userId), planType },
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

async function updateSubscription(userId, planType) {
  try {
    const startDate = new Date();
    const endDate = new Date();
    if (planType === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      { status: "Premium", planType, startDate, endDate, isActive: true },
      { upsert: true, new: true }
    );

    return { success: true, subscription };
  } catch (error) {
    console.error("Error updating subscription:", error.message);
    return { success: false, error: error.message };
  }
}
module.exports = {
  getAuthToken,
  createOrder,
  getPaymentKey,
  redirectToPaymentPage,
  updateSubscription,
};
