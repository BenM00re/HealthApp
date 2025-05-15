document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication on page load
    try {
        const res = await fetch('/auth/verify', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) {
            window.location.href = '/index.html?error=Please log in';
            return;
        }
        const welcomeEl = document.getElementById('welcome-username');
        if (welcomeEl) {
            welcomeEl.textContent = data.user.username || data.user.displayName || data.user.email || 'User';
        }
    } catch (e) {
        window.location.href = '/index.html?error=Please log in';
        return;
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        window.location.href = '/index.html';
    });

    // Load food log for a given date (default: today)
    async function loadFoodLog(dateStr) {
        const date = dateStr || new Date().toISOString().slice(0, 10);
        let logs = [];
        try {
            const res = await fetch(`/food/log/${date}`, {
                method: 'GET',
                credentials: 'include'
            });
            const data = await res.json();
            logs = data.entries || [];
        } catch (e) {
            logs = [];
        }

        // Group logs by meal
        const meals = { breakfast: [], lunch: [], dinner: [], snack: [] };
        logs.forEach(entry => {
            const meal = entry.meal || 'breakfast';
            if (meals[meal]) {
                meals[meal].push(entry);
            } else {
                meals['breakfast'].push(entry); // fallback
            }
        });

        // Update food log sections for each meal
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
            const foodItems = document.querySelector(`.food-items[data-meal="${meal}"]`);
            if (foodItems) {
                foodItems.innerHTML = '';
                meals[meal].forEach(entry => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span class="food-name">${entry.food} (${entry.quantity}g)</span>
                        <span class="food-calories">${entry.calories} kcal</span>
                        <button class="remove-entry-btn" data-entry-id="${entry._id}" data-meal="${meal}">X</button>
                    `;
                    foodItems.appendChild(li);
                });
            }
        });

        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-entry-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const entryId = e.target.getAttribute('data-entry-id');
                const date = logDateInput.value;
                if (confirm('Remove this entry?')) {
                    try {
                        const res = await fetch(`/food/log/${date}/${entryId}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        const result = await res.json();
                        if (result.success) {
                            loadFoodLog(date); // Reload log after deletion
                        } else {
                            alert('Failed to remove entry.');
                        }
                    } catch {
                        alert('Failed to remove entry.');
                    }
                }
            });
        });
        // Calculate totals
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
        let totalFiber = 0, totalSugar = 0, totalCholesterol = 0;
        logs.forEach(entry => {
            totalCalories += parseFloat(entry.calories);
            totalProtein += parseFloat(entry.protein);
            totalCarbs += parseFloat(entry.carbs);
            totalFat += parseFloat(entry.fat);
            if (entry.fiber) totalFiber += parseFloat(entry.fiber);
            if (entry.sugar) totalSugar += parseFloat(entry.sugar);
            if (entry.cholesterol) totalCholesterol += parseFloat(entry.cholesterol);
        });

        // Update summary values and progress indicators
        const calBar = document.querySelector('.calories-bar');
        const calLabel = document.querySelector('.calories-label');
        if (calBar && calLabel) {
            calBar.setAttribute('data-value', totalCalories.toFixed(0));
            calBar.setAttribute('data-max', 2000); // or your preferred max
            calLabel.textContent = `${totalCalories.toFixed(0)}/2000 kcal`;
        }

        // Update macros
        const macroSpans = document.querySelectorAll('.macro span');
        if (macroSpans.length === 3) {
            macroSpans[0].textContent = `${totalProtein.toFixed(0)}/150g`;
            macroSpans[1].textContent = `${totalCarbs.toFixed(0)}/250g`;
            macroSpans[2].textContent = `${totalFat.toFixed(0)}/65g`;
        }

        // Update protein bar
        const proteinBar = document.querySelector('.protein-bar');
        const proteinLabel = document.querySelector('.protein-label');
        if (proteinBar && proteinLabel) {
            proteinBar.setAttribute('data-value', totalProtein.toFixed(0));
            proteinBar.setAttribute('data-max', 150);
            proteinLabel.textContent = `${totalProtein.toFixed(0)}/150g`;
        }

        // Update carbs bar
        const carbsBar = document.querySelector('.carbs-bar');
        const carbsLabel = document.querySelector('.carbs-label');
        if (carbsBar && carbsLabel) {
            carbsBar.setAttribute('data-value', totalCarbs.toFixed(0));
            carbsBar.setAttribute('data-max', 250);
            carbsLabel.textContent = `${totalCarbs.toFixed(0)}/250g`;
        }

        // Update fat bar
        const fatBar = document.querySelector('.fat-bar');
        const fatLabel = document.querySelector('.fat-label');
        if (fatBar && fatLabel) {
            fatBar.setAttribute('data-value', totalFat.toFixed(0));
            fatBar.setAttribute('data-max', 65);
            fatLabel.textContent = `${totalFat.toFixed(0)}/65g`;
        }

        // Update fiber bar
        const fiberBar = document.querySelector('.fiber-bar');
        const fiberLabel = document.querySelector('.fiber-label');
        if (fiberBar && fiberLabel) {
            fiberBar.setAttribute('data-value', totalFiber.toFixed(0));
            fiberBar.setAttribute('data-max', 30);
            fiberLabel.textContent = `${totalFiber.toFixed(0)}/30g Fiber`;
            const fill = fiberBar.querySelector('.vertical-fill');
            const percent = Math.min((totalFiber / 30) * 100, 100);
            if (fill) fill.style.height = percent + '%';
        }
        // Update sugar bar
        const sugarBar = document.querySelector('.sugar-bar');
        const sugarLabel = document.querySelector('.sugar-label');
        if (sugarBar && sugarLabel) {
            sugarBar.setAttribute('data-value', totalSugar.toFixed(0));
            sugarBar.setAttribute('data-max', 50);
            sugarLabel.textContent = `${totalSugar.toFixed(0)}/50g Sugar`;
            const fill = sugarBar.querySelector('.vertical-fill');
            const percent = Math.min((totalSugar / 50) * 100, 100);
            if (fill) fill.style.height = percent + '%';
        }
        // Update cholesterol bar
        const cholesterolBar = document.querySelector('.cholesterol-bar');
        const cholesterolLabel = document.querySelector('.cholesterol-label');
        if (cholesterolBar && cholesterolLabel) {
            cholesterolBar.setAttribute('data-value', totalCholesterol.toFixed(0));
            cholesterolBar.setAttribute('data-max', 300);
            cholesterolLabel.textContent = `${totalCholesterol.toFixed(0)}/300mg Cholesterol`;
            const fill = cholesterolBar.querySelector('.vertical-fill');
            const percent = Math.min((totalCholesterol / 300) * 100, 100);
            if (fill) fill.style.height = percent + '%';
        }

        updateProgress();
    }

    // Date picker for viewing previous logs
    const logDateInput = document.getElementById('logDate');
    if (logDateInput) {
        const todayStr = new Date().toISOString().slice(0, 10);
        logDateInput.value = todayStr;
        logDateInput.max = todayStr;
        logDateInput.addEventListener('change', (e) => {
            loadFoodLog(e.target.value);
        });
    }

    // Initial load
    loadFoodLog();

    // Add Food button redirects to food.html
    const addFoodBtn = document.getElementById('add-food');
    if (addFoodBtn) {
        addFoodBtn.addEventListener('click', () => {
            window.location.href = 'food.html';
        });
    }

    // Update progress indicators
    function updateProgress() {
        // Calories
        const calBar = document.querySelector('.calories-bar');
        if (calBar) {
            const value = parseInt(calBar.getAttribute('data-value'));
            const max = parseInt(calBar.getAttribute('data-max'));
            const percentage = Math.min((value / max) * 100, 100);
            const fill = calBar.querySelector('.progress-fill');
            if (fill) fill.style.width = percentage + '%';
        }
        // Protein
        const proteinBar = document.querySelector('.protein-bar');
        if (proteinBar) {
            const value = parseInt(proteinBar.getAttribute('data-value'));
            const max = parseInt(proteinBar.getAttribute('data-max'));
            const percentage = Math.min((value / max) * 100, 100);
            const fill = proteinBar.querySelector('.progress-fill');
            if (fill) fill.style.width = percentage + '%';
        }
        // Carbs
        const carbsBar = document.querySelector('.carbs-bar');
        if (carbsBar) {
            const value = parseInt(carbsBar.getAttribute('data-value'));
            const max = parseInt(carbsBar.getAttribute('data-max'));
            const percentage = Math.min((value / max) * 100, 100);
            const fill = carbsBar.querySelector('.progress-fill');
            if (fill) fill.style.width = percentage + '%';
        }
        // Fat
        const fatBar = document.querySelector('.fat-bar');
        if (fatBar) {
            const value = parseInt(fatBar.getAttribute('data-value'));
            const max = parseInt(fatBar.getAttribute('data-max'));
            const percentage = Math.min((value / max) * 100, 100);
            const fill = fatBar.querySelector('.progress-fill');
            if (fill) fill.style.width = percentage + '%';
        }
    }

    // Water logging functionality
    const waterCountLabel = document.getElementById('water-count-label');
    const waterBottles = document.querySelectorAll('.water-bottles .bottle');
    const waterPlus = document.getElementById('water-plus');
    const waterMinus = document.getElementById('water-minus');
    const waterMlInput = document.getElementById('water-ml');
    const addWaterMlBtn = document.getElementById('add-water-ml');
    const WATER_MAX = 8;
    const GLASS_ML = 250;

    // Persist water ml per day in localStorage
    function getWaterKey() {
        return 'waterMl_' + new Date().toISOString().slice(0, 10);
    }
    function getWaterMl() {
        return parseInt(localStorage.getItem(getWaterKey())) || 0;
    }
    function setWaterMl(val) {
        localStorage.setItem(getWaterKey(), val);
    }
    function getWaterGlasses() {
        return Math.floor(getWaterMl() / GLASS_ML);
    }
    function updateWaterUI() {
        const ml = getWaterMl();
        const glasses = getWaterGlasses();
        waterBottles.forEach((bottle, idx) => {
            if (idx < glasses) {
                bottle.classList.add('filled');
            } else {
                bottle.classList.remove('filled');
            }
        });
        waterCountLabel.textContent = `${glasses}/${WATER_MAX} glasses (${ml} ml)`;
    }
    if (waterPlus && waterMinus) {
        waterPlus.addEventListener('click', () => {
            let ml = getWaterMl();
            if (getWaterGlasses() < WATER_MAX) {
                setWaterMl(ml + GLASS_ML);
                updateWaterUI();
            }
        });
        waterMinus.addEventListener('click', () => {
            let ml = getWaterMl();
            if (ml >= GLASS_ML) {
                setWaterMl(ml - GLASS_ML);
                updateWaterUI();
            }
        });
    }
    if (addWaterMlBtn && waterMlInput) {
        addWaterMlBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let ml = parseInt(waterMlInput.value);
            if (!ml || ml < 50) return;
            let total = getWaterMl() + ml;
            // Cap at 8 glasses worth
            if (total > WATER_MAX * GLASS_ML) total = WATER_MAX * GLASS_ML;
            setWaterMl(total);
            updateWaterUI();
            waterMlInput.value = '';
        });
    }
    updateWaterUI();
});