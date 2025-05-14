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
        // Optionally, you can call a logout endpoint if you implement one
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
                `;
                foodItems.appendChild(li);
            });
        }

        // Update summary
        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
        logs.forEach(entry => {
            totalCalories += parseFloat(entry.calories);
            totalProtein += parseFloat(entry.protein);
            totalCarbs += parseFloat(entry.carbs);
            totalFat += parseFloat(entry.fat);
        });

        // Update summary values (if you have elements for these)
        const calCircle = document.querySelector('.progress-circle');
        if (calCircle) {
            calCircle.querySelector('.value').textContent = totalCalories.toFixed(0);
        }
        // Update macros
        const macroSpans = document.querySelectorAll('.macro span');
        if (macroSpans.length === 3) {
            macroSpans[0].textContent = `${totalProtein.toFixed(0)}/150g`;
            macroSpans[1].textContent = `${totalCarbs.toFixed(0)}/250g`;
            macroSpans[2].textContent = `${totalFat.toFixed(0)}/65g`;
        }
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
        // Update circle progress
        const circle = document.querySelector('.progress-circle');
        if (circle) {
            const value = parseInt(circle.getAttribute('data-value'));
            const max = parseInt(circle.getAttribute('data-max'));
            const percentage = (value / max) * 100;
            circle.style.background = `conic-gradient(#4CAF50 0% ${percentage}%, #e0e0e0 ${percentage}% 100%)`;
        }

        // Update progress bars
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const value = parseInt(bar.getAttribute('data-value'));
            const max = parseInt(bar.getAttribute('data-max'));
            const percentage = (value / max) * 100;
            bar.style.setProperty('--progress', `${percentage}%`);
        });
    }

    updateProgress();
});