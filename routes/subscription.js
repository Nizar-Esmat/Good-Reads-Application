const express = require("express");
const auth = require("../middleware/auth");
const checkStatus = require("../middleware/checkStauts");
const router = express.Router();

const {
    createSubscription,
    updateSubscription,
    getSubscriptionStatus,
    deleteSubscription
} = require("../controllers/subscriptionController");

router.post("/", auth, createSubscription);
router.put("/", auth, checkStatus, updateSubscription);
router.get("/:userId", auth, getSubscriptionStatus);
router.delete("/:userId", auth, checkStatus, deleteSubscription);

module.exports = router;
