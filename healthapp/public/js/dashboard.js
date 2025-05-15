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

        // Update food log section
        const foodItems = document.querySelector('.food-items');
        if (foodItems) {
            foodItems.innerHTML = '';
            logs.forEach(entry => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="food-name">${entry.food} (${entry.quantity}g)</span>
                    <span class="food-calories">${entry.calories} kcal</span>
                    <button class="remove-entry-btn" data-entry-id="${entry._id}">X</button>
                    `;
                foodItems.appendChild(li);
            });
        }
        // Add event listeners for remove buttons
        foodItems.querySelectorAll('.remove-entry-btn').forEach(btn => {
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
        logs.forEach(entry => {
            totalCalories += parseFloat(entry.calories);
            totalProtein += parseFloat(entry.protein);
            totalCarbs += parseFloat(entry.carbs);
            totalFat += parseFloat(entry.fat);
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
});