const axios = require('axios');
const cache = require('../utils/cache');

class NutritionService {
  constructor() {
    this.apiKey = process.env.FOOD_API_KEY;
    this.appId = process.env.FOOD_API_ID;
    this.baseUrl = 'https://api.edamam.com/api/nutrition-data';
  }

  async getNutritionData(query) {
    const cacheKey = `nutrition:${query}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          app_id: this.appId,
          app_key: this.apiKey,
          ingr: query
        }
      });
      
      const formatted = this.formatNutritionData(response.data);
      cache.set(cacheKey, formatted, 3600); // Cache for 1 hour
      return formatted;
    } catch (error) {
      console.error('Nutrition API error:', error.message);
      throw new Error('Failed to fetch nutrition data');
    }
  }

  formatNutritionData(data) {
    return {
      calories: data.calories,
      macros: {
        protein: data.totalNutrients.PROCNT?.quantity || 0,
        carbs: data.totalNutrients.CHOCDF?.quantity || 0,
        fat: data.totalNutrients.FAT?.quantity || 0
      },
      details: data.totalNutrients
    };
  }
}

module.exports = new NutritionService();