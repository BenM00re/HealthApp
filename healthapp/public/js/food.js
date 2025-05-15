document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        window.location.href = '/index.html';
    });
});

// Handle "Search Grocery Products/Ingredients" form submission
document.getElementById('groceryForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const groceryName = document.getElementById('groceryName').value;
    const groceryType = document.getElementById('groceryType').value;

    if (!groceryName) {
        alert('Please enter a product or ingredient name.');
        return;
    }

    try {
        const response = await fetch(`/api/spoonacular/grocery-products?query=${encodeURIComponent(groceryName)}&type=${encodeURIComponent(groceryType)}`);
        const data = await response.json();

        if (data.success) {
            const groceryList = document.getElementById('groceryList');
            groceryList.innerHTML = ''; // Clear previous results

            data.products.forEach(product => {
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '1rem';
                listItem.innerHTML = `
                    <img src="${product.image}" alt="${product.title}" style="width: 100px; height: auto; margin-right: 10px;">
                    <strong>${product.title}</strong><br>
                    <button class="select-btn" data-title="${product.title}" data-calories="${product.calories}" data-protein="${product.protein}" data-carbs="${product.carbs}" data-fat="${product.fat}" data-fiber="${product.fiber}" data-sugar="${product.sugar}" data-cholesterol="${product.cholesterol}">Select</button>
                `;
                groceryList.appendChild(listItem);
            });

            document.getElementById('groceryResults').style.display = 'block';

            // Add event listeners to "Select" buttons
            document.querySelectorAll('.select-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const title = e.target.getAttribute('data-title');
                    const calories = e.target.getAttribute('data-calories');
                    const protein = e.target.getAttribute('data-protein');
                    const carbs = e.target.getAttribute('data-carbs');
                    const fat = e.target.getAttribute('data-fat');
                    const fiber = e.target.getAttribute('data-fiber');
                    const sugar = e.target.getAttribute('data-sugar');
                    const cholesterol = e.target.getAttribute('data-cholesterol');

                    // Populate the log food form
                    document.getElementById('selectedFood').value = title;
                    document.getElementById('logFoodSection').style.display = 'block';

                    // Store nutritional data for later use
                    document.getElementById('logFoodForm').dataset.calories = calories;
                    document.getElementById('logFoodForm').dataset.protein = protein;
                    document.getElementById('logFoodForm').dataset.carbs = carbs;
                    document.getElementById('logFoodForm').dataset.fat = fat;
                    document.getElementById('logFoodForm').dataset.fiber = fiber;
                    document.getElementById('logFoodForm').dataset.sugar = sugar;
                    document.getElementById('logFoodForm').dataset.cholesterol = cholesterol;
                });
            });
        } else {
            alert('No products or ingredients found.');
        }
    } catch (error) {
        console.error('Error fetching grocery products/ingredients:', error);
        alert('An error occurred. Please try again.');
    }
});

// Handle "Log Food" form submission
document.getElementById('logFoodForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const quantity = parseFloat(document.getElementById('quantity').value);
    if (isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid quantity in grams.');
        return;
    }

    // Retrieve stored nutritional data
    const calories = parseFloat(document.getElementById('logFoodForm').dataset.calories) || 0;
    const protein = parseFloat(document.getElementById('logFoodForm').dataset.protein) || 0;
    const carbs = parseFloat(document.getElementById('logFoodForm').dataset.carbs) || 0;
    const fat = parseFloat(document.getElementById('logFoodForm').dataset.fat) || 0;

    // Calculate nutritional values based on quantity
    const multiplier = quantity / 100;
    document.getElementById('calories').textContent = `${(calories * multiplier).toFixed(2)} kcal`;
    document.getElementById('protein').textContent = `${(protein * multiplier).toFixed(2)} g`;
    document.getElementById('carbs').textContent = `${(carbs * multiplier).toFixed(2)} g`;
    document.getElementById('fat').textContent = `${(fat * multiplier).toFixed(2)} g`;

    // Show the nutrition results and "Add to Diary" button
    document.getElementById('nutritionResults').style.display = 'block';
    document.getElementById('addToDiaryBtn').style.display = 'inline-block';

    // Store calculated values for diary logging
    document.getElementById('addToDiaryBtn').dataset.food = document.getElementById('selectedFood').value;
    document.getElementById('addToDiaryBtn').dataset.calories = (calories * multiplier).toFixed(2);
    document.getElementById('addToDiaryBtn').dataset.protein = (protein * multiplier).toFixed(2);
    document.getElementById('addToDiaryBtn').dataset.carbs = (carbs * multiplier).toFixed(2);
    document.getElementById('addToDiaryBtn').dataset.fat = (fat * multiplier).toFixed(2);
    document.getElementById('addToDiaryBtn').dataset.quantity = quantity;
});

// Add to Diary button logic
document.getElementById('addToDiaryBtn').addEventListener('click', async () => {
    const today = new Date().toISOString().slice(0, 10);
    let meal = 'breakfast';
    const mealSelect = document.getElementById('mealSelect');
    if (mealSelect) {
        meal = mealSelect.value;
    } else if (window.opener && window.opener.document) {
        const openerMealSelect = window.opener.document.getElementById('mealSelect');
        if (openerMealSelect) meal = openerMealSelect.value;
    }

    const logEntry = {
        food: document.getElementById('addToDiaryBtn').dataset.food,
        quantity: document.getElementById('addToDiaryBtn').dataset.quantity,
        calories: document.getElementById('addToDiaryBtn').dataset.calories,
        protein: document.getElementById('addToDiaryBtn').dataset.protein,
        carbs: document.getElementById('addToDiaryBtn').dataset.carbs,
        fat: document.getElementById('addToDiaryBtn').dataset.fat,
        fiber: document.getElementById('logFoodForm').dataset.fiber || 0,
        sugar: document.getElementById('logFoodForm').dataset.sugar || 0,
        cholesterol: document.getElementById('logFoodForm').dataset.cholesterol || 0,
        meal: meal,
        timestamp: new Date().toISOString()
    };

    const token = localStorage.getItem('authToken');
    try {
        const res = await fetch('/food/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {})
            },
            credentials: 'include',
            body: JSON.stringify({
                date: today,
                entry: logEntry
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Food logged!');
            document.getElementById('logFoodSection').style.display = 'none';
            document.getElementById('nutritionResults').style.display = 'none';
            document.getElementById('addToDiaryBtn').style.display = 'none';
        } else {
            alert('Failed to log food.');
        }
    } catch (err) {
        alert('Error logging food.');
    }
});