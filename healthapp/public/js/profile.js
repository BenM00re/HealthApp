document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication on page load
    try {
        const res = await fetch('/auth/verify', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) {
            window.location.href = '/index.html?error=Please log in';
            return;
        }
    } catch (e) {
        window.location.href = '/index.html?error=Please log in';
        return;
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        window.location.href = '/index.html';
    });

    // Form elements
    const profileForm = document.getElementById('profile-form');
    const genderInput = document.getElementById('gender');
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const activityInput = document.getElementById('activity');
    const calorieGoalSelect = document.getElementById('calorie-goal');
    
    // Calorie display elements
    const loseCaloriesEl = document.getElementById('lose-calories');
    const maintainCaloriesEl = document.getElementById('maintain-calories');
    const gainCaloriesEl = document.getElementById('gain-calories');
    
    // Macro sliders
    const proteinPercentInput = document.getElementById('protein-percent');
    const carbsPercentInput = document.getElementById('carbs-percent');
    const fatPercentInput = document.getElementById('fat-percent');
    
    // Macro display elements
    const proteinValueEl = document.getElementById('protein-value');
    const carbsValueEl = document.getElementById('carbs-value');
    const fatValueEl = document.getElementById('fat-value');
    const macroTotalEl = document.getElementById('macro-total');
    
    // Macro gram elements
    const proteinGramsEl = document.getElementById('protein-grams');
    const carbsGramsEl = document.getElementById('carbs-grams');
    const fatGramsEl = document.getElementById('fat-grams');
    
    // Additional goals
    const fiberGoalInput = document.getElementById('fiber-goal');
    const sugarGoalInput = document.getElementById('sugar-goal');
    const cholesterolGoalInput = document.getElementById('cholesterol-goal');
    
    // Save button
    const saveButton = document.getElementById('save-profile');
    
    // Goal card elements
    const goalCards = document.querySelectorAll('.goal-card');
    
    // Load saved profile data from server
    await loadProfileData();
    
    // Calculate calories when input changes
    [genderInput, ageInput, heightInput, weightInput, activityInput].forEach(input => {
        input.addEventListener('input', calculateCalories);
    });
    
    // Update macro percentages
    [proteinPercentInput, carbsPercentInput, fatPercentInput].forEach(input => {
        input.addEventListener('input', updateMacroPercentages);
    });
    
    // Goal card selection
    goalCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            goalCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
            
            // Set calorie goal select value based on card
            if (card.querySelector('h4').textContent === 'Weight Loss') {
                calorieGoalSelect.value = 'lose';
            } else if (card.querySelector('h4').textContent === 'Maintain Weight') {
                calorieGoalSelect.value = 'maintain';
            } else {
                calorieGoalSelect.value = 'gain';
            }
            
            // Update macros in grams
            calculateMacrosInGrams();
        });
    });
    
    // Update when calorie goal changes
    calorieGoalSelect.addEventListener('change', () => {
        // Update active card
        const activeCardIndex = calorieGoalSelect.value === 'lose' ? 0 : 
                                calorieGoalSelect.value === 'maintain' ? 1 : 2;
        goalCards.forEach(c => c.classList.remove('active'));
        goalCards[activeCardIndex].classList.add('active');
        
        // Update macros in grams
        calculateMacrosInGrams();
    });
    
    // Save profile
    saveButton.addEventListener('click', async (e) => {
        e.preventDefault();
        const profileData = {
            gender: genderInput.value,
            age: parseInt(ageInput.value) || 0,
            height: parseInt(heightInput.value) || 0,
            weight: parseInt(weightInput.value) || 0,
            activityLevel: parseFloat(activityInput.value) || 1.2,
            calorieGoal: calorieGoalSelect.value,
            proteinPercent: parseInt(proteinPercentInput.value) || 30,
            carbsPercent: parseInt(carbsPercentInput.value) || 40,
            fatPercent: parseInt(fatPercentInput.value) || 30,
            fiberGoal: parseInt(fiberGoalInput.value) || 30,
            sugarGoal: parseInt(sugarGoalInput.value) || 50,
            cholesterolGoal: parseInt(cholesterolGoalInput.value) || 300,
            loseCalories: parseInt(loseCaloriesEl.textContent) || 0,
            maintainCalories: parseInt(maintainCaloriesEl.textContent) || 0,
            gainCalories: parseInt(gainCaloriesEl.textContent) || 0,
            proteinGrams: parseInt(proteinGramsEl.textContent) || 0,
            carbsGrams: parseInt(carbsGramsEl.textContent) || 0,
            fatGrams: parseInt(fatGramsEl.textContent) || 0,
            lastUpdated: new Date().toISOString()
        };

        // Weight history logic
        let weightHistory = Array.isArray(profileData.weightHistory) ? profileData.weightHistory : [];
        const newWeight = parseFloat(weightInput.value);
        const today = new Date().toISOString().slice(0, 10);
        if (!isNaN(newWeight)) {
            // Only add if different from last entry or if no entry for today
            if (!weightHistory.length || weightHistory[weightHistory.length-1].weight !== newWeight || weightHistory[weightHistory.length-1].date !== today) {
                weightHistory.push({ date: today, weight: newWeight });
            }
        }

        // Get weight goal value
        const weightGoalInput = document.getElementById('weight-goal');
        const weightGoal = weightGoalInput ? parseFloat(weightGoalInput.value) || null : null;

        const profileToSave = {
            gender: genderInput.value,
            age: parseInt(ageInput.value) || 0,
            height: parseInt(heightInput.value) || 0,
            weight: parseInt(weightInput.value) || 0,
            activityLevel: parseFloat(activityInput.value) || 1.2,
            calorieGoal: calorieGoalSelect.value,
            proteinPercent: parseInt(proteinPercentInput.value) || 30,
            carbsPercent: parseInt(carbsPercentInput.value) || 40,
            fatPercent: parseInt(fatPercentInput.value) || 30,
            fiberGoal: parseInt(fiberGoalInput.value) || 30,
            sugarGoal: parseInt(sugarGoalInput.value) || 50,
            cholesterolGoal: parseInt(cholesterolGoalInput.value) || 300,
            loseCalories: parseInt(loseCaloriesEl.textContent) || 0,
            maintainCalories: parseInt(maintainCaloriesEl.textContent) || 0,
            gainCalories: parseInt(gainCaloriesEl.textContent) || 0,
            proteinGrams: parseInt(proteinGramsEl.textContent) || 0,
            carbsGrams: parseInt(carbsGramsEl.textContent) || 0,
            fatGrams: parseInt(fatGramsEl.textContent) || 0,
            lastUpdated: new Date().toISOString(),
            weightHistory,
            weightGoal
        };
        
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                },
                credentials: 'include',
                body: JSON.stringify(profileToSave)
            });
            
            const data = await res.json();
            
            if (data.success) {
                // Also save to localStorage as a backup
                localStorage.setItem('healthAppProfile', JSON.stringify(profileToSave));
                alert('Profile saved successfully!');
            } else {
                throw new Error(data.message || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            // As a fallback, save to localStorage
            localStorage.setItem('healthAppProfile', JSON.stringify(profileToSave));
            alert('Unable to save to server, profile saved locally only.');
        }
    });
    
    // Calculate BMR and TDEE
    function calculateCalories() {
        const gender = genderInput.value;
        const age = parseInt(ageInput.value) || 0;
        const heightCm = parseInt(heightInput.value) || 0;
        const weightKg = parseInt(weightInput.value) || 0;
        const activityLevel = parseFloat(activityInput.value) || 1.2;
        
        if (age <= 0 || heightCm <= 0 || weightKg <= 0) {
            return;
        }
        
        // Mifflin-St Jeor Equation for BMR
        let bmr = 0;
        if (gender === 'male') {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
            bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }
        
        // Calculate TDEE
        const tdee = Math.round(bmr * activityLevel);
        
        // Calculate goal calories
        const loseCalories = Math.round(tdee - 500); // 500 calorie deficit
        const maintainCalories = tdee;
        const gainCalories = Math.round(tdee + 500); // 500 calorie surplus
        
        // Update display
        loseCaloriesEl.textContent = loseCalories;
        maintainCaloriesEl.textContent = maintainCalories;
        gainCaloriesEl.textContent = gainCalories;
        
        // Calculate macros in grams
        calculateMacrosInGrams();
    }
    
    // Update macro percentages
    function updateMacroPercentages() {
        // Get current values
        let proteinPercent = parseInt(proteinPercentInput.value);
        let carbsPercent = parseInt(carbsPercentInput.value);
        let fatPercent = parseInt(fatPercentInput.value);
        
        // Calculate total
        const total = proteinPercent + carbsPercent + fatPercent;
        
        // Update display
        proteinValueEl.textContent = proteinPercent;
        carbsValueEl.textContent = carbsPercent;
        fatValueEl.textContent = fatPercent;
        macroTotalEl.textContent = total;
        
        // Add warning if total is not 100%
        if (total !== 100) {
            macroTotalEl.style.color = '#e74c3c';
        } else {
            macroTotalEl.style.color = '#2c3e50';
        }
        
        // Calculate macros in grams
        calculateMacrosInGrams();
    }
    
    // Calculate macros in grams based on selected calorie goal
    function calculateMacrosInGrams() {
        const calorieGoal = calorieGoalSelect.value;
        let calories = 0;
        
        // Get calories based on goal
        if (calorieGoal === 'lose') {
            calories = parseInt(loseCaloriesEl.textContent) || 0;
        } else if (calorieGoal === 'maintain') {
            calories = parseInt(maintainCaloriesEl.textContent) || 0;
        } else {
            calories = parseInt(gainCaloriesEl.textContent) || 0;
        }
        
        // Get macro percentages
        const proteinPercent = parseInt(proteinPercentInput.value) / 100;
        const carbsPercent = parseInt(carbsPercentInput.value) / 100;
        const fatPercent = parseInt(fatPercentInput.value) / 100;
        
        // Calculate grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
        const proteinGrams = Math.round((calories * proteinPercent) / 4);
        const carbsGrams = Math.round((calories * carbsPercent) / 4);
        const fatGrams = Math.round((calories * fatPercent) / 9);
        
        // Update display
        proteinGramsEl.textContent = proteinGrams;
        carbsGramsEl.textContent = carbsGrams;
        fatGramsEl.textContent = fatGrams;
    }
    
    // Load profile data from server
    async function loadProfileData() {
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                },
                credentials: 'include'
            });
            
            const data = await res.json();
            
            if (!data.success) {
                console.log('No profile data found or error loading profile');
                return;
            }
            
            const profileData = data.profile;
            
            // Only set form values if they exist in profile data
            if (profileData) {
                if (profileData.gender) genderInput.value = profileData.gender;
                if (profileData.age) ageInput.value = profileData.age;
                if (profileData.height) heightInput.value = profileData.height;
                if (profileData.weight) weightInput.value = profileData.weight;
                if (profileData.activityLevel) activityInput.value = profileData.activityLevel;
                if (profileData.calorieGoal) calorieGoalSelect.value = profileData.calorieGoal;

                // Set macro percentages
                if (profileData.proteinPercent) proteinPercentInput.value = profileData.proteinPercent;
                if (profileData.carbsPercent) carbsPercentInput.value = profileData.carbsPercent;
                if (profileData.fatPercent) fatPercentInput.value = profileData.fatPercent;

                // Set additional goals
                if (profileData.fiberGoal) fiberGoalInput.value = profileData.fiberGoal;
                if (profileData.sugarGoal) sugarGoalInput.value = profileData.sugarGoal;
                if (profileData.cholesterolGoal) cholesterolGoalInput.value = profileData.cholesterolGoal;

                // Set weight goal if present
                const weightGoalInput = document.getElementById('weight-goal');
                if (weightGoalInput && typeof profileData.weightGoal !== "undefined" && profileData.weightGoal !== null) {
                    weightGoalInput.value = profileData.weightGoal;
                }

                // Calculate calories
                calculateCalories();

                // Update macro percentages display
                updateMacroPercentages();

                // Set active goal card
                if (profileData.calorieGoal) {
                    const activeCardIndex = profileData.calorieGoal === 'lose' ? 0 : 
                                        profileData.calorieGoal === 'maintain' ? 1 : 2;
                    goalCards.forEach(c => c.classList.remove('active'));
                    goalCards[activeCardIndex].classList.add('active');
                }
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            // If server fetch fails, fall back to localStorage
            const profileData = JSON.parse(localStorage.getItem('healthAppProfile')) || {};
            
            // Set form values if they exist
            if (profileData.gender) genderInput.value = profileData.gender;
            if (profileData.age) ageInput.value = profileData.age;
            if (profileData.height) heightInput.value = profileData.height;
            if (profileData.weight) weightInput.value = profileData.weight;
            if (profileData.activityLevel) activityInput.value = profileData.activityLevel;
            if (profileData.calorieGoal) calorieGoalSelect.value = profileData.calorieGoal;
            
            // Same as before - process the localStorage data
            if (profileData.proteinPercent) proteinPercentInput.value = profileData.proteinPercent;
            if (profileData.carbsPercent) carbsPercentInput.value = profileData.carbsPercent;
            if (profileData.fatPercent) fatPercentInput.value = profileData.fatPercent;
            
            if (profileData.fiberGoal) fiberGoalInput.value = profileData.fiberGoal;
            if (profileData.sugarGoal) sugarGoalInput.value = profileData.sugarGoal;
            if (profileData.cholesterolGoal) cholesterolGoalInput.value = profileData.cholesterolGoal;
            
            calculateCalories();
            updateMacroPercentages();
            
            if (profileData.calorieGoal) {
                const activeCardIndex = profileData.calorieGoal === 'lose' ? 0 : 
                                    profileData.calorieGoal === 'maintain' ? 1 : 2;
                goalCards.forEach(c => c.classList.remove('active'));
                goalCards[activeCardIndex].classList.add('active');
            }
        }
    }
    
    // Save profile data to server
    async function saveProfile() {
        const profileData = {
            gender: genderInput.value,
            age: parseInt(ageInput.value) || 0,
            height: parseInt(heightInput.value) || 0,
            weight: parseInt(weightInput.value) || 0,
            activityLevel: parseFloat(activityInput.value) || 1.2,
            calorieGoal: calorieGoalSelect.value,
            proteinPercent: parseInt(proteinPercentInput.value) || 30,
            carbsPercent: parseInt(carbsPercentInput.value) || 40,
            fatPercent: parseInt(fatPercentInput.value) || 30,
            fiberGoal: parseInt(fiberGoalInput.value) || 30,
            sugarGoal: parseInt(sugarGoalInput.value) || 50,
            cholesterolGoal: parseInt(cholesterolGoalInput.value) || 300,
            loseCalories: parseInt(loseCaloriesEl.textContent) || 0,
            maintainCalories: parseInt(maintainCaloriesEl.textContent) || 0,
            gainCalories: parseInt(gainCaloriesEl.textContent) || 0,
            proteinGrams: parseInt(proteinGramsEl.textContent) || 0,
            carbsGrams: parseInt(carbsGramsEl.textContent) || 0,
            fatGrams: parseInt(fatGramsEl.textContent) || 0,
            lastUpdated: new Date().toISOString()
        };
        
        // Weight history logic
        let weightHistory = Array.isArray(profileData.weightHistory) ? profileData.weightHistory : [];
        const newWeight = parseFloat(weightInput.value);
        const today = new Date().toISOString().slice(0, 10);
        if (!isNaN(newWeight)) {
            // Only add if different from last entry or if no entry for today
            if (!weightHistory.length || weightHistory[weightHistory.length-1].weight !== newWeight || weightHistory[weightHistory.length-1].date !== today) {
                weightHistory.push({ date: today, weight: newWeight });
            }
        }
        
        const profileToSave = {
            gender: genderInput.value,
            age: parseInt(ageInput.value) || 0,
            height: parseInt(heightInput.value) || 0,
            weight: parseInt(weightInput.value) || 0,
            activityLevel: parseFloat(activityInput.value) || 1.2,
            calorieGoal: calorieGoalSelect.value,
            proteinPercent: parseInt(proteinPercentInput.value) || 30,
            carbsPercent: parseInt(carbsPercentInput.value) || 40,
            fatPercent: parseInt(fatPercentInput.value) || 30,
            fiberGoal: parseInt(fiberGoalInput.value) || 30,
            sugarGoal: parseInt(sugarGoalInput.value) || 50,
            cholesterolGoal: parseInt(cholesterolGoalInput.value) || 300,
            loseCalories: parseInt(loseCaloriesEl.textContent) || 0,
            maintainCalories: parseInt(maintainCaloriesEl.textContent) || 0,
            gainCalories: parseInt(gainCaloriesEl.textContent) || 0,
            proteinGrams: parseInt(proteinGramsEl.textContent) || 0,
            carbsGrams: parseInt(carbsGramsEl.textContent) || 0,
            fatGrams: parseInt(fatGramsEl.textContent) || 0,
            lastUpdated: new Date().toISOString(),
            weightHistory,
            weightGoal
        };
        
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': 'Bearer ' + token } : {})
                },
                credentials: 'include',
                body: JSON.stringify(profileToSave)
            });
            
            const data = await res.json();
            
            if (data.success) {
                // Also save to localStorage as a backup
                localStorage.setItem('healthAppProfile', JSON.stringify(profileToSave));
                alert('Profile saved successfully!');
            } else {
                throw new Error(data.message || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            // As a fallback, save to localStorage
            localStorage.setItem('healthAppProfile', JSON.stringify(profileToSave));
            alert('Unable to save to server, profile saved locally only.');
        }
    }
});