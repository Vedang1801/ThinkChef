// File: src/components/Home.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./RecipeCard";
import Tips from "./Tips";
import "../styles/newHome.css";
import { toast } from "react-toastify";

interface Recipe {
  recipe_id: number;
  title: string;
  description: string;
  user_id: number;
  image: string;
  created_at: string;
  Instruction: string;
  ingredients?: string[];
  average_rating?: number;
  author?: string;
}

interface HomeProps {
  searchTerm: string;
  sortType: string;
}

const Home: React.FC<HomeProps> = ({ searchTerm, sortType }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, sortType]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let url = "/api/recipes";
      if (sortType) url = `/api/recipes/sort/${sortType}`;
      if (searchTerm) url += `?search=${encodeURIComponent(searchTerm)}`;
      const recipesResponse = await axios.get(url);
      const ingredientsResponse = await axios.get("/api/ingredients");
      const ingredientsData = ingredientsResponse.data;

      const combinedRecipes: Recipe[] = (recipesResponse.data.recipes || recipesResponse.data).map((recipe: Recipe) => {
        const ingredients = ingredientsData
          .filter((ingredient: any) => ingredient.recipe_id === recipe.recipe_id)
          .map((ingredient: any) => `${ingredient.item}: ${ingredient.quantity}`);
        return { ...recipe, ingredients };
      });

      setRecipes(combinedRecipes);
    } catch (error) {
      toast.error("Failed to load recipes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage-root">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover, Cook, Share</h1>
          <p>
            Find your next favorite recipe or share your own culinary creations with the world.
          </p>
          <a href="/addrecipes" className="cta-btn">Share a Recipe</a>
        </div>
      </section>

      {/* Featured Recipes - Epicurious Style */}
      <section className="featured-section">
        <h2 className="section-title">Featured Recipes</h2>
        {loading ? (
          <div className="loading-spinner">Loading recipes...</div>
        ) : (
          <div className="epicurious-recipe-grid">
            {recipes.length === 0 ? (
              <p className="no-recipes-message">No recipes found.</p>
            ) : (
              recipes.map((recipe) => (
                <RecipeCard key={recipe.recipe_id} recipe={recipe} />
              ))
            )}
          </div>
        )}
      </section>

      {/* Tips Section */}
      <section className="tips-section">
        <h2 className="section-title">Cooking Tips</h2>
        <Tips />
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <div>© {new Date().getFullYear()} Think Chef. All rights reserved.</div>
        <div>
          <a href="/about">About</a> | <a href="/contact">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
