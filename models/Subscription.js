const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    status: { type: String, enum: ["Free", "Premium"], default: "Free" },
    planType: { type: String, enum:  ["monthly", "yearly"],  default: null ,lowercase: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },  
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
