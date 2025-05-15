const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const ExercisePlan = require("../models/ExercisePlan");

// Save a workout plan
router.post("/", async (req, res) => {
  try {
    const { exercises } = req.body;
    if (!Array.isArray(exercises)) {
      return res.status(400).json({ success: false, message: "Invalid format" });
    }

    const newPlan = new ExercisePlan({
      exercises,
      createdAt: new Date()
    });

    await newPlan.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving plan:", err);
    res.status(500).json({ success: false, error: "Failed to save plan" });
  }
});


// Load all workout plans
router.get("/", async (req, res) => {
  try {
    const plans = await ExercisePlan.find().sort({ createdAt: -1 });
    res.json({ success: true, plans });
  } catch (err) {
    console.error("Error loading plans:", err);
    res.status(500).json({ success: false, error: "Failed to load plans" });
  }
});

module.exports = router;