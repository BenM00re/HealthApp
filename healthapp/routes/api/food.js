const express = require('express');
const router = express.Router();
const nutritionService = require('../../services/nutrition');
//const authMiddleware = require('../../middleware/auth');

// Protect all food API routes
//router.use(authMiddleware);
router.get('/test', async (req, res) => {
  try {
    const data = await nutrition.searchFood("apple");
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message, note: "Make sure your .env has FOOD_API_ID and FOOD_API_KEY" });
    
  }
});
// Search nutrition data
router.get('/search/:query', async (req, res, next) => {
  try {
    const nutritionData = await nutritionService.getNutritionData(req.params.query);
    res.json(nutritionData);
  } catch (error) {
    next(error);
  }
});

// Log food entry
router.post('/log', async (req, res, next) => {
  try {
    const { foodId, quantity, mealType } = req.body;
    // In a real app, you'd save to database here
    res.json({ 
      status: 'success',
      data: { foodId, quantity, mealType }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;