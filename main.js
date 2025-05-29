const API_KEY = (typeof window !== 'undefined' && window.config) 
  ? window.config.SPOONACULAR_API_KEY 
  : "YOUR_API_KEY_HERE";
const BASE_URL = "https://api.spoonacular.com/recipes";

// API endpoints
const SEARCH_API_URL = `${BASE_URL}/complexSearch`;
const RANDOM_API_URL = `${BASE_URL}/random`;
const RECIPE_INFO_URL = `${BASE_URL}`; // Will append /{id}/information

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsGrid = document.getElementById("results-grid");
const messageArea = document.getElementById("message-area");
const randomButton = document.getElementById("random-button");
const modal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("recipe-details-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

// Filter elements
const vegToggle = document.getElementById("veg-toggle");
const nonvegToggle = document.getElementById("nonveg-toggle");

// Filter state
let filters = {
  vegetarian: false,
  nonVegetarian: false
};

// Initialize filter toggles
vegToggle.addEventListener('click', () => {
  filters.vegetarian = !filters.vegetarian;
  vegToggle.classList.toggle('active', filters.vegetarian);
  
  // If vegetarian is selected, deselect non-vegetarian
  if (filters.vegetarian && filters.nonVegetarian) {
    filters.nonVegetarian = false;
    nonvegToggle.classList.remove('active');
  }
});

nonvegToggle.addEventListener('click', () => {
  filters.nonVegetarian = !filters.nonVegetarian;
  nonvegToggle.classList.toggle('active', filters.nonVegetarian);
  
  // If non-vegetarian is selected, deselect vegetarian
  if (filters.nonVegetarian && filters.vegetarian) {
    filters.vegetarian = false;
    vegToggle.classList.remove('active');
  }
});

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    searchRecipes(searchTerm);
  } else {
    showMessage("Please enter a search term", true);
  }
});

async function searchRecipes(query) {
  showMessage(`Searching for "${query}"...`, false, true);
  resultsGrid.innerHTML = "";
  
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("API key not configured. Please set up your Spoonacular API key.");
    }
    
    // Build query parameters
    let url = `${SEARCH_API_URL}?apiKey=${API_KEY}&query=${encodeURIComponent(query)}&number=12&addRecipeInformation=true&fillIngredients=true`;
    
    // Add diet filters
    if (filters.vegetarian) {
      url += "&diet=vegetarian";
    } else if (filters.nonVegetarian) {
      // Spoonacular doesn't have a direct "non-vegetarian" filter, so we exclude vegetarian diets
      url += "&excludeDiet=vegetarian,vegan";
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    clearMessage();
    
    if (data.results && data.results.length > 0) {
      displayRecipes(data.results);
    } else {
      const filterType = filters.vegetarian ? 'vegetarian ' : filters.nonVegetarian ? 'non-vegetarian ' : '';
      showMessage(`No ${filterType}recipes found for "${query}"`);
    }
  } catch (error) {
    console.error('Search error:', error);
    showMessage("Something went wrong. Please try again.", true);
  }
}

function showMessage(message, isError = false, isLoading = false) {
  messageArea.textContent = message;
  messageArea.className = "message";
  if (isError) messageArea.classList.add("error");
  if (isLoading) messageArea.classList.add("loading");
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message";
}

function displayRecipes(recipes) {
  if (!recipes || recipes.length === 0) {
    showMessage("No recipes to display");
    return;
  }
  
  recipes.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.id;
    
    // Determine if recipe is vegetarian based on Spoonacular data
    const isVeg = recipe.vegetarian || (recipe.diets && recipe.diets.includes('vegetarian'));
    const dietBadge = `<div class="diet-badge ${isVeg ? 'veg' : 'nonveg'}">${isVeg ? 'VEG' : 'NON-VEG'}</div>`;
    
    recipeDiv.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}" loading="lazy">
      ${dietBadge}
      <h3>${recipe.title}</h3>
    `;
    resultsGrid.appendChild(recipeDiv);
  });
}

randomButton.addEventListener("click", getRandomRecipe);

async function getRandomRecipe() {
  showMessage("Fetching a random recipe...", false, true);
  resultsGrid.innerHTML = "";
  
  try {
    // Check if API key is available
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("API key not configured. Please set up your Spoonacular API key.");
    }
    
    // Build URL with filters
    let url = `${RANDOM_API_URL}?apiKey=${API_KEY}&number=1`;
    
    // Add diet filters for random recipe
    if (filters.vegetarian) {
      url += "&tags=vegetarian";
    } else if (filters.nonVegetarian) {
      // For non-vegetarian, we'll fetch random and filter, or use meat tags
      url += "&tags=meat";
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    clearMessage();
    
    if (data.recipes && data.recipes.length > 0) {
      displayRecipes(data.recipes);
    } else {
      showMessage("Could not fetch a random recipe. Please try again.", true);
    }
  } catch (error) {
    console.error('Random recipe error:', error);
    showMessage("Failed to fetch a random recipe. Please try again.", true);
  }
}

function showModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

resultsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".recipe-item");
  if (card) {
    const recipeId = card.dataset.id;
    getRecipeDetails(recipeId);
  }
});

async function getRecipeDetails(id) {
  modalContent.innerHTML = '<p class="message loading">Loading details...</p>';
  showModal();
  
  try {
    if (!API_KEY || API_KEY === "YOUR_API_KEY_HERE") {
      throw new Error("API key not configured. Please set up your Spoonacular API key.");
    }
    
    const response = await fetch(`${RECIPE_INFO_URL}/${id}/information?apiKey=${API_KEY}&includeNutrition=false`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const recipe = await response.json();
    displayRecipeDetails(recipe);
  } catch (error) {
    console.error('Recipe details error:', error);
    modalContent.innerHTML = '<p class="message error">Failed to load recipe details. Please try again.</p>';
  }
}

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

function displayRecipeDetails(recipe) {
  // Build ingredients list from Spoonacular format
  const ingredients = [];
  if (recipe.extendedIngredients) {
    recipe.extendedIngredients.forEach(ingredient => {
      const amount = ingredient.amount ? `${ingredient.amount} ${ingredient.unit || ''}` : '';
      ingredients.push(`<li>${amount} ${ingredient.name}</li>`);
    });
  }
  
  // Determine if vegetarian
  const isVeg = recipe.vegetarian || (recipe.diets && recipe.diets.includes('vegetarian'));
  const dietBadgeHTML = `<div style="display: inline-block; padding: 6px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: 600; color: white; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 15px; background-color: ${isVeg ? 'var(--primary-color)' : '#e74c3c'};">${isVeg ? 'VEG' : 'NON-VEG'}</div>`;
  
  // Build HTML sections
  const cuisineHTML = recipe.cuisines && recipe.cuisines.length > 0
    ? `<h3>Cuisine: ${recipe.cuisines.join(', ')}</h3>`
    : "";
    
  const dishTypesHTML = recipe.dishTypes && recipe.dishTypes.length > 0
    ? `<h3>Dish Type: ${recipe.dishTypes.join(', ')}</h3>`
    : "";
    
  const readyInMinutesHTML = recipe.readyInMinutes
    ? `<h3>Ready in: ${recipe.readyInMinutes} minutes</h3>`
    : "";
    
  const servingsHTML = recipe.servings
    ? `<h3>Servings: ${recipe.servings}</h3>`
    : "";
    
  const ingredientsHTML = ingredients.length > 0
    ? `<h3>Ingredients</h3><ul>${ingredients.join("")}</ul>`
    : "";
    
  const instructionsHTML = recipe.instructions
    ? `<h3>Instructions</h3><p>${recipe.instructions.replace(/\n/g, "<br>")}</p>`
    : recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0
    ? `<h3>Instructions</h3><ol>${recipe.analyzedInstructions[0].steps.map(step => `<li>${step.step}</li>`).join('')}</ol>`
    : '<h3>Instructions</h3><p>Instructions not available.</p>';
    
  const sourceHTML = recipe.sourceUrl
    ? `<div class="source-wrapper"><a href="${recipe.sourceUrl}" target="_blank">View Original Recipe</a></div>`
    : "";
    
  const spoonacularHTML = recipe.spoonacularSourceUrl
    ? `<div class="source-wrapper"><a href="${recipe.spoonacularSourceUrl}" target="_blank">View on Spoonacular</a></div>`
    : "";
  
  modalContent.innerHTML = `
    <h2>${recipe.title}</h2>
    ${dietBadgeHTML}
    <img src="${recipe.image}" alt="${recipe.title}">
    ${readyInMinutesHTML}
    ${servingsHTML}
    ${cuisineHTML}
    ${dishTypesHTML}
    ${ingredientsHTML}
    ${instructionsHTML}
    ${sourceHTML}
    ${spoonacularHTML}
  `;
}