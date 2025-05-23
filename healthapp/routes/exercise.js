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
    console.log(plans);
  } catch (err) {
    console.error("Error loading plans:", err);
    res.status(500).json({ success: false, error: "Failed to load plans" });
  }
});

// Delete a workout plan for the logged-in user
router.delete("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ExercisePlan.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Plan not found or not authorized" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error deleting plan:", err);
    return res.status(500).json({ success: false, error: "Failed to delete plan" });
  }
});

module.exports = router;