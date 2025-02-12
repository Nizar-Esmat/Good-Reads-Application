const Subscription = require("../models/Subscription");
const User = require("../models/Users");

// create subscription
exports.createSubscription = async (req, res) => {
    const { userId, status, planType } = req.body; 

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingSubscription = await Subscription.findOne({ userId });
        if (existingSubscription) {
            return res.status(400).json({ message: "User already has a subscription" });
        }


        if (planType) {
            planType = planType.toLowerCase();
            if (!["monthly", "yearly"].includes(planType)) {
                return res.status(400).json({ message: "Invalid plan type" });
            }
        }

        const startDate = new Date();
        const endDate = new Date();
        if (planType === "Monthly") {
            endDate.setMonth(endDate.getMonth() + 1); 
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const newSubscription = new Subscription({
            userId,
            status,
            planType, 
            startDate,
            endDate,
        });

        await newSubscription.save();
        user.status = status;
        await user.save();

        res.status(201).json({ message: "Subscription created successfully", subscription: newSubscription });
    } catch (err) {
        res.status(500).json({ message: "Error creating subscription", error: err.message });
    }
};


// update status
exports.updateSubscription = async (req, res) => {
    const { userId, status, planType } = req.body; 

    try {
        let subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        let updatedPlanType = planType ? planType.toLowerCase() : subscription.planType;
        if (planType && !["monthly", "yearly"].includes(updatedPlanType)) {
            return res.status(400).json({ message: "Invalid plan type" });
        }

        subscription.status = status;
        subscription.planType = updatedPlanType;
        subscription.startDate = new Date();
        subscription.endDate = new Date();

        if (updatedPlanType === "monthly") {
            subscription.endDate.setMonth(subscription.startDate.getMonth() + 1);
        } else if (updatedPlanType === "yearly") {
            subscription.endDate.setFullYear(subscription.startDate.getFullYear() + 1);
        }

        await subscription.save();

        const user = await User.findById(userId);
        if (user) {
            user.status = status;
            await user.save();
        }

        res.status(200).json({ message: "Subscription updated successfully", subscription });
    } catch (error) {
        res.status(500).json({ message: "Error updating subscription", error: error.message });
    }
};

// get ststus fro subscription
exports.getSubscriptionStatus = async (req, res) => {
    const { userId } = req.params;

    try {
        let subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            subscription = new Subscription({
                userId,
                status: "Free",
                planType: null,  
                startDate: new Date(),
                endDate: null,   
            });
            await subscription.save();
        }

        res.status(200).json({
            message: "Subscription found",
            status: subscription.status,
            planType: subscription.planType, 
            isActive: subscription.isActive,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching subscription status", error: err.message });
    }
};


// Delete Subscription
exports.deleteSubscription = async (req, res) => {
    const { userId } = req.params;

    try {
        const subscription = await Subscription.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found" });
        }

        await Subscription.deleteOne({ userId });

        const user = await User.findById(userId);
        if (user) {
            user.status = "Free";
            await user.save();
        }

        res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting subscription", error: err.message });
    }
};
;
