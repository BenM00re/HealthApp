const mongoose = require("mongoose");

const exercisePlanSchema = new mongoose.Schema({
  exercises: [
    {
      name: String,
      sets: Number,
      reps: Number
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ExercisePlan", exercisePlanSchema);