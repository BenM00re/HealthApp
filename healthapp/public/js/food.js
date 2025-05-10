// Handle "Search Grocery Products" form submission
document.getElementById('groceryForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const groceryName = document.getElementById('groceryName').value;

    if (!groceryName) {
        alert('Please enter a product name.');
        return;
    }

    try {
        const response = await fetch(`/api/spoonacular/grocery-products?query=${encodeURIComponent(groceryName)}`);
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
                    <button class="select-btn" data-title="${product.title}" data-calories="${product.calories}" data-protein="${product.protein}" data-carbs="${product.carbs}" data-fat="${product.fat}">Select</button>
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

                    // Populate the log food form
                    document.getElementById('selectedFood').value = title;
                    document.getElementById('logFoodSection').style.display = 'block';

                    // Store nutritional data for later use
                    document.getElementById('logFoodForm').dataset.calories = calories;
                    document.getElementById('logFoodForm').dataset.protein = protein;
                    document.getElementById('logFoodForm').dataset.carbs = carbs;
                    document.getElementById('logFoodForm').dataset.fat = fat;
                });
            });
        } else {
            alert('No products found.');
        }
    } catch (error) {
        console.error('Error fetching grocery products:', error);
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

    // Show the nutrition results
    document.getElementById('nutritionResults').style.display = 'block';
});