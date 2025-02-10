const Subscription = require("../models/Subscription");

module.exports = async (req, res, next) => {
    const { userId, requestedPages } = req.query;  

    try {
        let subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            subscription = { status: "Free" };
        }

        if (subscription.status === "Free" && requestedPages > 10) {
            return res.status(403).json({ message: "You can only view the first 10 pages with a Free subscription. Please upgrade to Premium." });
        }

        next(); 
    } catch (error) {
        res.status(500).json({ message: "Error checking subscription", error: error.message });
    }
};
