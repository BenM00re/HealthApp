const express = require('express');
const axios = require('axios');
const router = express.Router();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// Route to get nutrition information
router.get('/nutrition', async (req, res) => {
    const query = req.query.query; // Get the food name from the request
    if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    try {
        
        const searchResponse = await axios.get('https://api.spoonacular.com/food/ingredients/search', {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                query: query,
                number: 1 // Limit to one result
            }
        });

        if (searchResponse.data.results.length === 0) {
            return res.status(404).json({ success: false, error: 'Food not found' });
        }

        const ingredientId = searchResponse.data.results[0].id;

        
        const nutritionResponse = await axios.get(`https://api.spoonacular.com/food/ingredients/${ingredientId}/information`, {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                amount: 100, // Get nutrition for 100 grams
                unit: 'grams'
            }
        });

        const nutrition = nutritionResponse.data.nutrition.nutrients;

        // Extract relevant nutrients
        const calories = nutrition.find(n => n.name === 'Calories')?.amount || 0;
        const protein = nutrition.find(n => n.name === 'Protein')?.amount || 0;
        const carbs = nutrition.find(n => n.name === 'Carbohydrates')?.amount || 0;
        const fat = nutrition.find(n => n.name === 'Fat')?.amount || 0;

        console.log('Nutrition Data:', { calories, protein, carbs, fat }); // Log the extracted nutrition data

        res.json({
            success: true,
            nutrition: {
                calories,
                protein,
                carbs,
                fat
            }
        });
    } catch (error) {
        console.error('Error fetching nutrition data:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch nutrition data' });
    }
});

// Route to search for grocery products
router.get('/grocery-products', async (req, res) => {
    const { query, minCalories, maxCalories, minProtein, maxProtein } = req.query;

    if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter is required' });
    }

    try {
        
        const searchResponse = await axios.get('https://api.spoonacular.com/food/products/search', {
            params: {
                apiKey: SPOONACULAR_API_KEY,
                query,
                minCalories,
                maxCalories,
                minProtein,
                maxProtein,
                number: 3, // Limit the number of results
                addProductInformation: true // Include additional product information
            }
        });

        if (searchResponse.data.products.length === 0) {
            return res.status(404).json({ success: false, error: 'No products found' });
        }

        
        const products = await Promise.all(
            searchResponse.data.products.map(async (product) => {
                try {
                    const productDetailsResponse = await axios.get(`https://api.spoonacular.com/food/products/${product.id}`, {
                        params: {
                            apiKey: SPOONACULAR_API_KEY
                        }
                    });

                    const productDetails = productDetailsResponse.data;

                    // Extract relevant details
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
                        servings: productDetails.servings || null, // Include serving size and number of servings
                        caloricBreakdown: productDetails.nutrition?.caloricBreakdown || null // Include caloric breakdown
                    };
                } catch (error) {
                    console.error(`Error fetching details for product ID ${product.id}:`, error.message);
                    return null; // Skip this product if fetching details fails
                }
            })
        );

        // Filter out any null products (failed fetches)
        const validProducts = products.filter(product => product !== null);

        console.log('Processed Products:', validProducts); // Log the processed product data

        res.json({ success: true, products: validProducts });
    } catch (error) {
        console.error('Error fetching grocery products:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch grocery products' });
    }
});

module.exports = router;