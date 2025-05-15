const mongoose = require('mongoose');

const ExercisePlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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

module.exports = mongoose.model('ExercisePlan', ExercisePlanSchema);