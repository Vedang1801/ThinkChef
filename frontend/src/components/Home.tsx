import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios for making HTTP requests
import RecipeCard from "./RecipeCard"; // Import the RecipeCard component
import Tips from "./Tips";
import "../App.css";
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";



interface Recipe {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  user_id: number;
  image: string;
  created_at: Date;
  ingredients: { item: string; quantity: string }[]; // Modify Recipe interface to include ingredients
}

const Home: React.FC = () => {
  // Specify the type of the recipes state
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      // Fetch data from both API endpoints
      const recipesResponse = await axios.get("/api/recipes");
      const ingredientsResponse = await axios.get("/api/ingredients");

      // Extract data from responses
      const recipesData: Recipe[] = recipesResponse.data;
      const ingredientsData: {
        recipe_id: number;
        item: string;
        quantity: string;
      }[] = ingredientsResponse.data;

      // Combine recipes and ingredients data
      const combinedRecipes: Recipe[] = recipesData.map((recipe) => {
        const ingredients = ingredientsData
          .filter((ingredient) => ingredient.recipe_id === recipe.recipe_id)
          .map((ingredient) => `${ingredient.item}: ${ingredient.quantity}`);
        return {
          ...recipe,
          ingredients,
        };
      });

      // Set the combined recipes data in the state
      setRecipes(combinedRecipes);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error
    }
  };

  return (
    // <div className="home-container">
    //   <div className="home-background"></div>
    //   <div className="container mx-auto px-4 py-8">
    //     <div className="centered-container">
    //       <div className="recipes-box">
    //         <h2 className="text-3xl font-semibold mb-4">Recipes</h2>
    //       </div>
    //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    //         {recipes.map(recipe => (
    //           <RecipeCard key={recipe.recipe_id} recipe={recipe} />
    //         ))}
    //       </div>
    //     </div>
    //   </div>
    // </div>
    <div className="home-container">
      <div className="home-background"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="centered-container">
          <div className="recipes-box">
            <h2 className="recipeboxtitle">Recipes</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {/* Render RecipeCard components */}
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
      <footer>
        {/* Render the Tips component at the footer */}
        <Tips />
      </footer>
    </div>
  );
};

export default Home;
