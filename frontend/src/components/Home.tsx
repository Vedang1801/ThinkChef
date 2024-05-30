// Home.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./RecipeCard";
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
  ingredients: { item: string; quantity: string }[];
}

interface HomeProps {
  searchTerm: string;
}

const Home: React.FC<HomeProps> = ({ searchTerm }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const fetchRecipes = async () => {
    try {
      const recipesResponse = await axios.get("/api/recipes");
      const ingredientsResponse = await axios.get("/api/ingredients");

      const recipesData: Recipe[] = recipesResponse.data;
      const ingredientsData: {
        recipe_id: number;
        item: string;
        quantity: string;
      }[] = ingredientsResponse.data;

      const combinedRecipes: Recipe[] = recipesData.map((recipe) => {
        const ingredients = ingredientsData
          .filter((ingredient) => ingredient.recipe_id === recipe.recipe_id)
          .map((ingredient) => `${ingredient.item}: ${ingredient.quantity}`);
        return {
          ...recipe,
          ingredients,
        };
      });

      setRecipes(combinedRecipes);
      setFilteredRecipes(combinedRecipes); // Initialize filteredRecipes
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (searchTerm === "") {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecipes(filtered);
    }
  };

  return (
    <div className="home-container">
      <div className="home-background"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="centered-container">
          <div className="recipes-box">
            <h2 className="recipeboxtitle">RECIPES</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
      <footer>
        <Tips />
      </footer>
    </div>
  );
};

export default Home;
