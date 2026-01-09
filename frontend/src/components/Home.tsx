// File: src/components/Home.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./recipe/RecipeCard";
import Tips from "./Tips";
import "../styles/newHome.css";
import { ArrowRight, ChefHat, Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./auth/authContext";

// Recipe interface to match backend response
interface Recipe {
  recipe_id: number;
  title: string;
  description: string;
  user_id: number;
  image: string;
  created_at: string;
  instruction: string; // Lowercase to match DB
  ingredients?: string[];
  average_rating?: number;
  author?: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const Home: React.FC = () => {
  // Auth state
  const { loggedIn } = useAuth();

  // State for recipes, loading, and pagination
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured recipes (limit 8) on mount
  useEffect(() => {
    fetchFeaturedRecipes();
  }, []);

  const fetchFeaturedRecipes = async () => {
    try {
      setLoading(true);
      // Fetch only 8 newest recipes for homepage
      const params = new URLSearchParams();
      params.append('limit', '8');
      params.append('_t', Date.now().toString());
      const finalUrl = `${API_URL}/api/recipes?${params.toString()}`;

      const response = await axios.get(finalUrl);
      const data = response.data;

      const recipesList = data.recipes || [];

      let combinedRecipes: Recipe[] = [];
      if (recipesList.length > 0) {
        const ingredientsResponse = await axios.get(`${API_URL}/api/ingredients`);
        const ingredientsData = ingredientsResponse.data;
        combinedRecipes = recipesList
          .filter((recipe: any) => recipe && recipe.recipe_id)
          .map((recipe: Recipe) => {
            const ingredients = ingredientsData
              .filter((ingredient: any) => ingredient.recipe_id === recipe.recipe_id)
              .map((ingredient: any) => `${ingredient.item}: ${ingredient.quantity}`);
            return { ...recipe, ingredients };
          });
      }
      setRecipes(combinedRecipes);
    } catch (error) {
      console.error("Error fetching featured recipes:", error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homepage-root">
      {/* Hero Section with CTA */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Delicious Recipes</h1>
          <p>
            Find your next favorite recipe or share your own culinary creations with our community of food lovers.
          </p>
          <Link to="/addrecipes" className="cta-btn">Create Recipe</Link>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="featured-section">
        <div className="section-header">
          <h2 className="section-title">Featured Recipes</h2>
          <Link to="/recipes" className="view-all">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {/* Loading, empty, or recipe grid */}
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <div className="loading-text">Loading Recipes...</div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-state">
            <h2>No recipes found</h2>
            <p>Be the first to add a delicious recipe!</p>
            <Link to="/addrecipes" className="add-recipe-btn">
              Add Recipe
            </Link>
          </div>
        ) : (
          <div className="epicurious-recipe-grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        )}
      </section>
      {/* Promotional Banner */}
      <div className="promo-section">
        <div className="promo-container">
          <div className="promo-banner">
            <h3>Ready to Get Creative in the Kitchen?</h3>
            <p>Try our new AI Recipe Generator! Input the ingredients you have on hand, and we'll create a delicious recipe just for you.</p>
            <div className="promo-actions">
              <Link to="/addrecipes" className="secondary-cta-btn">Create Recipe</Link>
              <Link
                to={loggedIn ? "/recipe-generator" : "/login"}
                className="secondary-cta-btn ai-btn"
              >
                AI Recipe Generator
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Tips Section */}
      <section className="tips-section">
        <div className="section-header">
          <h2 className="section-title">Cooking Tips</h2>
          <a href="/tips" className="view-all">
            More tips <ArrowRight size={16} />
          </a>
        </div>
        <Tips />
      </section>
      {/* Footer Section */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3><ChefHat size={24} style={{ display: 'inline', marginRight: '8px' }} />Think Chef</h3>
            <p>Discover, cook, and share delicious recipes with food lovers around the world.</p>
          </div>
          <div className="footer-links">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/recipes">All Recipes</Link></li>
              <li>
                <Link to="/recipes">Popular</Link>
              </li>
              <li>
                <Link to="/recipes">Latest</Link>
              </li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Information</h4>
            <ul>
              <li><a href="mailto:support@thinkchef.com">Contact</a></li>
              <li><a href="https://github.com/Vedang1801" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Account</h4>
            <ul>
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/addrecipes">Create Recipe</Link></li>
              {loggedIn && <li><Link to="/recipe-generator">AI Generator</Link></li>}
            </ul>
          </div>
          <div className="footer-bottom">
            <div className="copyright">
              © {new Date().getFullYear()} Think Chef. All rights reserved.
            </div>
            <div className="social-links">
              <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
              <a href="#" aria-label="Twitter"><Twitter size={18} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
