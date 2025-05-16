const form = document.getElementById("exercise-form");
const exerciseList = document.getElementById("exercise-list");
const saveButton = document.getElementById("save-plan");
const savedPlansDiv = document.getElementById("saved-plans");

let exercises = [];

// Load saved plans immediately on page load
document.addEventListener("DOMContentLoaded", () => {
  loadPlans();
  // Save user id to localStorage for cross-tab communication
  fetch('/auth/verify', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user && data.user._id) {
        localStorage.setItem('healthAppUser', JSON.stringify({ _id: data.user._id }));
      }
    });
  document.getElementById('logoutBtn').addEventListener('click', () => {
        window.location.href = '/index.html';
    });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("exercise-name").value.trim();
  const sets = parseInt(document.getElementById("sets").value);
  const reps = parseInt(document.getElementById("reps").value);
  const weightInput = document.getElementById("weight").value.trim();
  const unit = document.getElementById("unit").value;

  if (!name || sets < 1 || reps < 1) {
    alert("Please enter valid values.");
    return;
  }

  // Parse weight if provided
  const weight = weightInput === "" ? null : parseFloat(weightInput);
  if (weight !== null && (isNaN(weight) || weight < 0)) {
    alert("Please enter a valid non-negative number for weight.");
    return;
  }

  const exercise = { name, sets, reps };

  if (weight !== null) {
    exercise.weight = weight;
    exercise.unit = unit;
  }

  exercises.push(exercise);
  renderExerciseList();
  form.reset();
});

// Save workout plan
saveButton.addEventListener("click", async () => {
  if (exercises.length === 0) {
    alert("You must add at least one exercise before saving a plan.");
    return;
  }

  try {
    const response = await fetch("/api/exercises", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ exercises })
    });

    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error("Invalid JSON response:\n" + text);
    }

    const result = await response.json();
    if (result.success) {
      alert("Workout plan saved successfully!");
      exercises = [];
      renderExerciseList();
      loadPlans();
    } else {
      alert("Failed to save workout plan.");
    }
  } catch (err) {
    console.error("Error saving plan:", err.message || err);
  }
});

async function loadPlans() {
  try {
    const response = await fetch("/api/exercises", {
      credentials: "include",
    });
    const result = await response.json();

    if (!result.success) {
      alert("Failed to load plans.");
      return;
    }

    savedPlansDiv.innerHTML = "";

    result.plans.forEach((plan, index) => {
      const planDiv = document.createElement("div");
      planDiv.classList.add("plan");

      const planTitle = document.createElement("h3");
      planTitle.textContent = `Plan ${index + 1} - ${new Date(plan.createdAt).toLocaleString()}`;
      planDiv.appendChild(planTitle);

      const ul = document.createElement("ul");
      plan.exercises.forEach((ex) => {
        const li = document.createElement("li");

        const hasWeight = ex.weight !== null && ex.weight !== undefined && ex.unit.length > 0;
        const weightText = hasWeight ? ` @ ${ex.weight} ${ex.unit}` : "";

        li.textContent = `${ex.name} - ${ex.sets} sets x ${ex.reps} reps${weightText}`;
        ul.appendChild(li);
      });

      planDiv.appendChild(ul);

      // Delete button
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete Plan";
      deleteButton.className = "delete-plan-btn";
      deleteButton.addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete this plan?")) {
          try {
            const deleteRes = await fetch(`/api/exercises/${plan._id}`, {
              method: "DELETE",
              credentials: "include",
            });

            const contentType = deleteRes.headers.get("Content-Type");
            if (!contentType || !contentType.includes("application/json")) {
              const text = await deleteRes.text();
              throw new Error("Expected JSON but got:\n" + text);
            }

            const deleteResult = await deleteRes.json();
            if (deleteResult.success) {
              alert("Plan deleted.");
              loadPlans();
            } else {
              alert("Failed to delete plan.");
            }
          } catch (err) {
            console.error("Error deleting plan:", err);
            alert("An error occurred while deleting the plan.");
          }
        }
      });

      planDiv.appendChild(deleteButton);
      savedPlansDiv.appendChild(planDiv);
    });
  } catch (err) {
    console.error("Error loading plans:", err);
    alert("An error occurred while loading plans.");
  }
}

function renderExerciseList() {
  exerciseList.innerHTML = "";

  const template = document.getElementById("exercise-item-template");

  exercises.forEach((ex, index) => {
    const clone = template.content.cloneNode(true);
    const li = clone.querySelector("li");
    const textSpan = clone.querySelector(".exercise-text");
    const removeBtn = clone.querySelector(".remove-btn");

    const hasWeight = ex.weight !== null && ex.weight !== undefined && ex.unit;
    const weightText = hasWeight ? ` @ ${ex.weight} ${ex.unit}` : "";

    textSpan.textContent = `${ex.name} - ${ex.sets} sets x ${ex.reps} reps${weightText}`;

    removeBtn.addEventListener("click", () => {
      exercises.splice(index, 1);
      renderExerciseList();
    });

    exerciseList.appendChild(li);
  });
}

// --- Daily Calories Burned Logic ---
const caloriesBurnedForm = document.getElementById('calories-burned-form');
const caloriesBurnedInput = document.getElementById('calories-burned-input');
const caloriesBurnedStatus = document.getElementById('calories-burned-status');

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadCaloriesBurned() {
  const data = JSON.parse(localStorage.getItem('caloriesBurnedToday') || '{}');
  if (data.date === getTodayStr()) {
    caloriesBurnedInput.value = data.value || '';
    return data.value || 0;
  } else {
    caloriesBurnedInput.value = '';
    localStorage.removeItem('caloriesBurnedToday');
    return 0;
  }
}

function saveCaloriesBurned(val) {
  // Use per-user key if possible
  let userId = null;
  try {
    const user = JSON.parse(localStorage.getItem('healthAppUser'));
    if (user && user._id) userId = user._id;
  } catch (e) {}
  const key = userId ? `caloriesBurnedToday_${userId}` : 'caloriesBurnedToday';
  localStorage.setItem(key, JSON.stringify({ date: getTodayStr(), value: val }));
  // Notify dashboard immediately
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify({ date: getTodayStr(), value: val }) }));
}

if (caloriesBurnedForm) {
  loadCaloriesBurned();
  caloriesBurnedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = parseInt(caloriesBurnedInput.value) || 0;
    saveCaloriesBurned(val);
    caloriesBurnedStatus.textContent = 'Saved!';
    setTimeout(() => { caloriesBurnedStatus.textContent = ''; }, 1500);
  });
}

// Reset at midnight
setInterval(() => {
  const data = JSON.parse(localStorage.getItem('caloriesBurnedToday') || '{}');
  if (data.date && data.date !== getTodayStr()) {
    localStorage.removeItem('caloriesBurnedToday');
    if (caloriesBurnedInput) caloriesBurnedInput.value = '';
  }
}, 60 * 1000); // check every minute
