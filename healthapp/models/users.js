const mongoose = require('mongoose')

const FoodLogEntrySchema = new mongoose.Schema({
    food: String,
    quantity: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    timestamp: { type: Date, default: Date.now }
});

const FoodLogSchema = new mongoose.Schema({
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    entries: [FoodLogEntrySchema]
});
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String }, // hashed password for local users
    googleId: { type: String, unique: true, sparse: true, required: false }, // <-- not required
    displayName: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    image: { type: String },
    createdAt: { type: Date, default: Date.now },
    foodLogs: [FoodLogSchema]
})

module.exports = mongoose.model('User', UserSchema)