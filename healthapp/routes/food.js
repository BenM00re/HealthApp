const express = require('express');
const axios = require('axios');
const router = express.Router();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// Route to get nutrition information (unchanged)
router.get('/nutrition', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }
    try {
        const searchResponse = await axios.get('https://api.spoonacular.com/food/ingredients/search', {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                query: query,
                number: 1
            }
        });

        if (searchResponse.data.results.length === 0) {
            return res.status(404).json({ success: false, error: 'Food not found' });
        }

        const ingredientId = searchResponse.data.results[0].id;

        const nutritionResponse = await axios.get(`https://api.spoonacular.com/food/ingredients/${ingredientId}/information`, {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                amount: 100,
                unit: 'grams'
            }
        });

        const nutrition = nutritionResponse.data.nutrition.nutrients;
        const calories = nutrition.find(n => n.name === 'Calories')?.amount || 0;
        const protein = nutrition.find(n => n.name === 'Protein')?.amount || 0;
        const carbs = nutrition.find(n => n.name === 'Carbohydrates')?.amount || 0;
        const fat = nutrition.find(n => n.name === 'Fat')?.amount || 0;

        res.json({
            success: true,
            nutrition: { calories, protein, carbs, fat }
        });
    } catch (error) {
        console.error('Error fetching nutrition data:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch nutrition data' });
    }
});

// Unified route for grocery products and ingredients
router.get('/grocery-products', async (req, res) => {
    const { query, minCalories, maxCalories, minProtein, maxProtein, type } = req.query;

    if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    try {
        if (type === 'ingredient') {
            // Ingredient search
            const searchResponse = await axios.get('https://api.spoonacular.com/food/ingredients/search', {
                params: {
                    apiKey: SPOONACULAR_API_KEY,
                    query,
                    number: 5
                }
            });

            if (!searchResponse.data.results.length) {
                return res.status(404).json({ success: false, error: 'No ingredients found' });
            }

            const ingredients = await Promise.all(
                searchResponse.data.results.map(async (ingredient) => {
                    try {
                        const nutritionResponse = await axios.get(
                            `https://api.spoonacular.com/food/ingredients/${ingredient.id}/information`,
                            {
                                params: {
                                    apiKey: SPOONACULAR_API_KEY,
                                    amount: 100,
                                    unit: 'grams'
                                }
                            }
                        );
                        const nutrients = nutritionResponse.data.nutrition?.nutrients || [];
                        const calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
                        const protein = nutrients.find(n => n.name === 'Protein')?.amount || 0;
                        const carbs = nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
                        const fat = nutrients.find(n => n.name === 'Fat')?.amount || 0;

                        return {
                            id: ingredient.id,
                            title: ingredient.name,
                            image: `https://spoonacular.com/cdn/ingredients_250x250/${ingredient.image}`,
                            calories,
                            protein,
                            carbs,
                            fat
                        };
                    } catch (error) {
                        console.error(`Error fetching nutrition for ingredient ID ${ingredient.id}:`, error.message);
                        return null;
                    }
                })
            );

            const validIngredients = ingredients.filter(i => i !== null);
            return res.json({ success: true, products: validIngredients });
        } else {
            // Default: grocery product search
            const searchResponse = await axios.get('https://api.spoonacular.com/food/products/search', {
                params: {
                    apiKey: SPOONACULAR_API_KEY,
                    query,
                    minCalories,
                    maxCalories,
                    minProtein,
                    maxProtein,
                    number: 5,
                    addProductInformation: true
                }
            });

            if (!searchResponse.data.products.length) {
                return res.status(404).json({ success: false, error: 'No products found' });
            }

            const products = await Promise.all(
                searchResponse.data.products.map(async (product) => {
                    try {
                        const productDetailsResponse = await axios.get(
                            `https://api.spoonacular.com/food/products/${product.id}`,
                            {
                                params: { apiKey: SPOONACULAR_API_KEY }
                            }
                        );
                        const productDetails = productDetailsResponse.data;
                        const nutrients = productDetails.nutrition?.nutrients || [];
                        const calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
                        const protein = nutrients.find(n => n.name === 'Protein')?.amount || 0;
                        const carbs = nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
                        const fat = nutrients.find(n => n.name === 'Fat')?.amount || 0;

                        return {
                            id: product.id,
                            title: product.title,
                            image: product.image,
                            calories,
                            protein,
                            carbs,
                            fat,
                            servings: productDetails.servings || null,
                            caloricBreakdown: productDetails.nutrition?.caloricBreakdown || null
                        };
                    } catch (error) {
                        console.error(`Error fetching details for product ID ${product.id}:`, error.message);
                        return null;
                    }
                })
            );

            const validProducts = products.filter(product => product !== null);
            return res.json({ success: true, products: validProducts });
        }
    } catch (error) {
        console.error('Error fetching products/ingredients:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch products/ingredients' });
    }
});

module.exports = router;