const express = require("express");
const router = express.Router();
const ExercisePlan = require("../models/ExercisePlan");

// Middleware to ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, error: "Not authenticated" });
}

// Save a workout plan for the logged-in user
router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { exercises } = req.body;

    if (!Array.isArray(exercises)) {
      return res.status(400).json({ success: false, message: "Invalid format" });
    }

    const newPlan = new ExercisePlan({
      user: req.user._id,
      exercises,
    });

    await newPlan.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving plan:", err);
    res.status(500).json({ success: false, error: "Failed to save plan" });
  }
});

// Load all workout plans for the logged-in user
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const plans = await ExercisePlan.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (err) {
    console.error("Error loading plans:", err);
    res.status(500).json({ success: false, error: "Failed to load plans" });
  }
});

module.exports = router;