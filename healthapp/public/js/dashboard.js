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

    // Profile settings - default values
    let profileSettings = {
        calorieGoal: 'maintain',
        loseCalories: 1500,
        maintainCalories: 2000,
        gainCalories: 2500,
        proteinGrams: 150,
        carbsGrams: 250,
        fatGrams: 65,
        fiberGoal: 30,
        sugarGoal: 50,
        cholesterolGoal: 300
    };

    // Load profile settings
    await loadProfileSettings();

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

        // Get the appropriate calorie goal based on user's preference
        const calorieGoal = getCalorieGoal();
        
        // Update summary values and progress indicators
        const calBar = document.querySelector('.calories-bar');
        const calLabel = document.querySelector('.calories-label');
        if (calBar && calLabel) {
            calBar.setAttribute('data-value', totalCalories.toFixed(0));
            calBar.setAttribute('data-max', calorieGoal);
            calLabel.textContent = `${totalCalories.toFixed(0)}/${calorieGoal} kcal`;
        }

        // Update macros with user's goals
        // Update protein bar
        const proteinBar = document.querySelector('.protein-bar');
        const proteinLabel = document.querySelector('.protein-label');
        if (proteinBar && proteinLabel) {
            proteinBar.setAttribute('data-value', totalProtein.toFixed(0));
            proteinBar.setAttribute('data-max', profileSettings.proteinGrams);
            proteinLabel.textContent = `${totalProtein.toFixed(0)}/${profileSettings.proteinGrams}g`;
        }

        // Update carbs bar
        const carbsBar = document.querySelector('.carbs-bar');
        const carbsLabel = document.querySelector('.carbs-label');
        if (carbsBar && carbsLabel) {
            carbsBar.setAttribute('data-value', totalCarbs.toFixed(0));
            carbsBar.setAttribute('data-max', profileSettings.carbsGrams);
            carbsLabel.textContent = `${totalCarbs.toFixed(0)}/${profileSettings.carbsGrams}g`;
        }

        // Update fat bar
        const fatBar = document.querySelector('.fat-bar');
        const fatLabel = document.querySelector('.fat-label');
        if (fatBar && fatLabel) {
            fatBar.setAttribute('data-value', totalFat.toFixed(0));
            fatBar.setAttribute('data-max', profileSettings.fatGrams);
            fatLabel.textContent = `${totalFat.toFixed(0)}/${profileSettings.fatGrams}g`;
        }

        // Update fiber bar
        const fiberBar = document.querySelector('.fiber-bar');
        const fiberLabel = document.querySelector('.fiber-label');
        if (fiberBar && fiberLabel) {
            fiberBar.setAttribute('data-value', totalFiber.toFixed(0));
            fiberBar.setAttribute('data-max', profileSettings.fiberGoal);
            fiberLabel.textContent = `${totalFiber.toFixed(0)}/${profileSettings.fiberGoal}g Fiber`;
            const fill = fiberBar.querySelector('.vertical-fill');
            const percent = Math.min((totalFiber / profileSettings.fiberGoal) * 100, 100);
            if (fill) fill.style.height = percent + '%';
        }
        // Update sugar bar
        const sugarBar = document.querySelector('.sugar-bar');
        const sugarLabel = document.querySelector('.sugar-label');
        if (sugarBar && sugarLabel) {
            sugarBar.setAttribute('data-value', totalSugar.toFixed(0));
            sugarBar.setAttribute('data-max', profileSettings.sugarGoal);
            sugarLabel.textContent = `${totalSugar.toFixed(0)}/${profileSettings.sugarGoal}g Sugar`;
            const fill = sugarBar.querySelector('.vertical-fill');
            const percent = Math.min((totalSugar / profileSettings.sugarGoal) * 100, 100);
            if (fill) fill.style.height = percent + '%';
        }
        // Update cholesterol bar
        const cholesterolBar = document.querySelector('.cholesterol-bar');
        const cholesterolLabel = document.querySelector('.cholesterol-label');
        if (cholesterolBar && cholesterolLabel) {
            cholesterolBar.setAttribute('data-value', totalCholesterol.toFixed(0));
            cholesterolBar.setAttribute('data-max', profileSettings.cholesterolGoal);
            cholesterolLabel.textContent = `${totalCholesterol.toFixed(0)}/${profileSettings.cholesterolGoal}mg Cholesterol`;
            const fill = cholesterolBar.querySelector('.vertical-fill');
            const percent = Math.min((totalCholesterol / profileSettings.cholesterolGoal) * 100, 100);
            if (fill) fill.style.height = percent + '%';
        }

        updateProgress();
        updateNutrientBars(totalFiber, totalSugar, totalCholesterol);
    }

    // Function to get the appropriate calorie goal based on user's preference
    function getCalorieGoal() {
        switch (profileSettings.calorieGoal) {
            case 'lose':
                return profileSettings.loseCalories;
            case 'gain':
                return profileSettings.gainCalories;
            case 'maintain':
            default:
                return profileSettings.maintainCalories;
        }
    }

    // Load profile settings from server or localStorage
    async function loadProfileSettings() {
        try {
            // Try to get profile from server 
            const res = await fetch('/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (data.success && data.profile) {
                // Update profile settings with server data
                updateProfileSettings(data.profile);
            } else {
                // If server request fails or returns no data, try localStorage
                const localProfile = JSON.parse(localStorage.getItem('healthAppProfile'));
                if (localProfile) {
                    updateProfileSettings(localProfile);
                }
            }
        } catch (error) {
            console.error('Error loading profile settings:', error);
            // If server request fails, try localStorage
            try {
                const localProfile = JSON.parse(localStorage.getItem('healthAppProfile'));
                if (localProfile) {
                    updateProfileSettings(localProfile);
                }
            } catch (e) {
                console.error('Could not load profile settings from localStorage:', e);
                // Keep using default values
            }
        }
    }

    // Update profile settings object with data from server or localStorage
    function updateProfileSettings(data) {
        // Only update if values exist and are valid
        if (data.calorieGoal) profileSettings.calorieGoal = data.calorieGoal;
        if (data.loseCalories && data.loseCalories > 0) profileSettings.loseCalories = data.loseCalories;
        if (data.maintainCalories && data.maintainCalories > 0) profileSettings.maintainCalories = data.maintainCalories;
        if (data.gainCalories && data.gainCalories > 0) profileSettings.gainCalories = data.gainCalories;
        if (data.proteinGrams && data.proteinGrams > 0) profileSettings.proteinGrams = data.proteinGrams;
        if (data.carbsGrams && data.carbsGrams > 0) profileSettings.carbsGrams = data.carbsGrams;
        if (data.fatGrams && data.fatGrams > 0) profileSettings.fatGrams = data.fatGrams;
        if (data.fiberGoal && data.fiberGoal > 0) profileSettings.fiberGoal = data.fiberGoal;
        if (data.sugarGoal && data.sugarGoal > 0) profileSettings.sugarGoal = data.sugarGoal;
        if (data.cholesterolGoal && data.cholesterolGoal > 0) profileSettings.cholesterolGoal = data.cholesterolGoal;
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

function updateNutrientBars(fiber, sugar, cholesterol) {
  const fiberBar = document.querySelector('.fiber-bar .vertical-fill');
  const fiberLabel = document.querySelector('.fiber-bar .vertical-label span');
  const sugarBar = document.querySelector('.sugar-bar .vertical-fill');
  const sugarLabel = document.querySelector('.sugar-bar .vertical-label span');
  const cholesterolBar = document.querySelector('.cholesterol-bar .vertical-fill');
  const cholesterolLabel = document.querySelector('.cholesterol-bar .vertical-label span');

  // Set max values (should match HTML data-max attributes)
  const fiberMax = 30;
  const sugarMax = 50;
  const cholesterolMax = 300;

  // Calculate fill heights as percent
  fiberBar.style.height = Math.min((fiber / fiberMax) * 100, 100) + '%';
  sugarBar.style.height = Math.min((sugar / sugarMax) * 100, 100) + '%';
  cholesterolBar.style.height = Math.min((cholesterol / cholesterolMax) * 100, 100) + '%';

  // Update label values
  if (fiberLabel) fiberLabel.textContent = `(${fiber}/${fiberMax}g)`;
  if (sugarLabel) sugarLabel.textContent = `(${sugar}/${sugarMax}g)`;
  if (cholesterolLabel) cholesterolLabel.textContent = `(${cholesterol}/${cholesterolMax}mg)`;
}

// --- Dashboard Weight History Chart ---
function renderDashboardWeightChart(weightHistory) {
    const ctx = document.getElementById('weightChartDashboard');
    const dateDiv = document.getElementById('weight-history-dates');
    if (!ctx) return;
    if (window.dashboardWeightChart) window.dashboardWeightChart.destroy();
    if (!weightHistory || weightHistory.length === 0) {
        if (dateDiv) dateDiv.textContent = 'No weight history.';
        return;
    }
    const labels = weightHistory.map(entry => new Date(entry.date).toLocaleDateString());
    const data = weightHistory.map(entry => entry.weight);
    window.dashboardWeightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Weight (kg)',
                data: data,
                borderColor: '#468fe2',
                backgroundColor: 'rgba(70,143,226,0.08)',
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#00C48C',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { title: { display: true, text: 'Date' }, ticks: { autoSkip: true, maxTicksLimit: 5 } },
                y: { title: { display: true, text: 'Weight (kg)' }, beginAtZero: false }
            }
        }
    });
    // Show the most recent date and weight
    if (dateDiv && weightHistory.length > 0) {
        const last = weightHistory[weightHistory.length-1];
        dateDiv.textContent = `Last update: ${new Date(last.date).toLocaleDateString()} (${last.weight} kg)`;
    }
}

// Load weight history from profile and render chart
async function loadDashboardWeightHistory() {
    try {
        const res = await fetch('/profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success && data.profile && Array.isArray(data.profile.weightHistory)) {
            renderDashboardWeightChart(data.profile.weightHistory);
        } else {
            renderDashboardWeightChart([]);
        }
    } catch (e) {
        renderDashboardWeightChart([]);
    }
}

// On DOMContentLoaded, load the dashboard weight chart
if (document.getElementById('weightChartDashboard')) {
    if (typeof Chart === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function() { loadDashboardWeightHistory(); };
        document.head.appendChild(script);
    } else {
        loadDashboardWeightHistory();
    }
}

function loadExercisePlansToDashboard() {
    fetch("/api/exercises", {
        credentials: "include"
    })
        .then(res => res.json())
        .then(result => {
            const container = document.getElementById("exercise-plans-list");
            container.innerHTML = "";

            if (!result.success || result.plans.length === 0) {
                container.innerHTML = "<p>No exercise plans yet.</p>";
                return;
            }

            result.plans.forEach((plan, index) => {
                const planDiv = document.createElement("div");
                planDiv.classList.add("exercise-plan");

                const title = document.createElement("h3");
                title.textContent = `Plan ${index + 1} - ${new Date(plan.createdAt).toLocaleDateString()}`;
                planDiv.appendChild(title);

                const ul = document.createElement("ul");
                plan.exercises.forEach(ex => {
                    const li = document.createElement("li");
                    li.textContent = `${ex.name} - ${ex.sets} sets x ${ex.reps} reps`;
                    ul.appendChild(li);
                });
                planDiv.appendChild(ul);

                const deleteBtn = document.createElement("button");
                deleteBtn.className = "delete-plan-btn";
                deleteBtn.textContent = "Delete";
                deleteBtn.addEventListener("click", async () => {
                    if (confirm("Are you sure you want to delete this plan?")) {
                        try {
                            const res = await fetch(`/api/exercises/${plan._id}`, {
                                method: "DELETE",
                                credentials: "include"
                            });
                            const data = await res.json();
                            if (data.success) {
                                loadExercisePlansToDashboard();
                            } else {
                                alert("Failed to delete the plan.");
                            }
                        } catch (err) {
                            console.error("Delete error:", err);
                        }
                    }
                });

                planDiv.appendChild(deleteBtn);
                container.appendChild(planDiv);
            });
        })
        .catch(err => {
            console.error("Failed to load exercise plans:", err);
        });
}

// Call on load
document.addEventListener("DOMContentLoaded", loadExercisePlansToDashboard);