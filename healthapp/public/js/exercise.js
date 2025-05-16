const form = document.getElementById("exercise-form");
const exerciseList = document.getElementById("exercise-list");
const saveButton = document.getElementById("save-plan");
const savedPlansDiv = document.getElementById("saved-plans");

let exercises = [];

// Handle logout
document.addEventListener("DOMContentLoaded", function () {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      window.location.href = "/index.html";
    });
  }

  loadPlans(); // Automatically load saved plans on page load
});

// Handle new exercise submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("exercise-name").value.trim();
  const sets = parseInt(document.getElementById("sets").value);
  const reps = parseInt(document.getElementById("reps").value);

  if (!name || sets < 1 || reps < 1) {
    alert("Please enter valid values.");
    return;
  }

  const exercise = { name, sets, reps };
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
      body: JSON.stringify({ exercises }),
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
      loadPlans(); // Refresh plans
    } else {
      alert("Failed to save workout plan.");
    }
  } catch (err) {
    console.error("Error saving plan:", err.message || err);
  }
});

// Render exercise input list
function renderExerciseList() {
  exerciseList.innerHTML = "";

  const template = document.getElementById("exercise-item-template");

  exercises.forEach((ex, index) => {
    const clone = template.content.cloneNode(true);
    const li = clone.querySelector("li");
    const textSpan = clone.querySelector(".exercise-text");
    const removeBtn = clone.querySelector(".remove-btn");

    textSpan.textContent = `${ex.name} - ${ex.sets} sets x ${ex.reps} reps`;

    removeBtn.addEventListener("click", () => {
      exercises.splice(index, 1);
      renderExerciseList();
    });

    exerciseList.appendChild(li);
  });
}

// Load all saved plans on page load
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

        const weightText = ex.weight && ex.unit ? ` @ ${ex.weight} ${ex.unit}` : "";
        li.textContent = `${ex.name} - ${ex.sets} sets x ${ex.reps} reps${weightText}`;

        ul.appendChild(li);
      });

      planDiv.appendChild(ul);

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
              loadPlans(); // Reload after delete
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
