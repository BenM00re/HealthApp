const mongoose = require('mongoose')

const FoodLogEntrySchema = new mongoose.Schema({
    food: String,
    quantity: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    cholesterol: Number,
    meal: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'breakfast' },
    timestamp: { type: Date, default: Date.now }
});

const FoodLogSchema = new mongoose.Schema({
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    entries: [FoodLogEntrySchema]
});


const ProfileSchema = new mongoose.Schema({
    gender: String,
    age: Number,
    height: Number,
    weight: Number,
    activityLevel: Number,
    calorieGoal: { type: String, enum: ['lose', 'maintain', 'gain'], default: 'maintain' },
    proteinPercent: { type: Number, default: 30 },
    carbsPercent: { type: Number, default: 40 },
    fatPercent: { type: Number, default: 30 },
    fiberGoal: { type: Number, default: 30 },
    sugarGoal: { type: Number, default: 50 },
    cholesterolGoal: { type: Number, default: 300 },
    loseCalories: Number,
    maintainCalories: Number,
    gainCalories: Number,
    proteinGrams: Number,
    carbsGrams: Number,
    fatGrams: Number,
    lastUpdated: { type: Date, default: Date.now },
    weightHistory: [{ date: String, weight: Number }]
});

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true, required: false }, // <-- not required
    displayName: { type: String, required: false },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    image: { type: String },
    createdAt: { type: Date, default: Date.now },
    foodLogs: [FoodLogSchema],
    profile: ProfileSchema
})

module.exports = mongoose.model('User', UserSchema)