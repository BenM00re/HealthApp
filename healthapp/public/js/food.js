document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('food-search-form');
    const resultsDiv = document.getElementById('nutrition-results');
  
    if (searchForm) {
      searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('food-query').value.trim();
        
        if (!query) {
          alert('Please enter a food item');
          return;
        }
  
        try {
          const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1');
          
          const response = await fetch(`/api/food/search/${encodeURIComponent(query)}`, {
            headers: {
              'x-auth-token': token,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) throw new Error('Failed to fetch data');
          
          const data = await response.json();
          displayResults(data);
        } catch (error) {
          console.error('Error:', error);
          resultsDiv.innerHTML = `<div class="error">${error.message}</div>`;
        }
      });
    }
  
    function displayResults(data) {
      resultsDiv.innerHTML = `
        <div class="nutrition-card">
          <h3>Nutrition Information</h3>
          <p><strong>Calories:</strong> ${data.calories.toFixed(1)}</p>
          <p><strong>Protein:</strong> ${data.macros.protein.toFixed(1)}g</p>
          <p><strong>Carbs:</strong> ${data.macros.carbs.toFixed(1)}g</p>
          <p><strong>Fat:</strong> ${data.macros.fat.toFixed(1)}g</p>
        </div>
      `;
    }
  });