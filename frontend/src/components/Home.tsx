// File: src/components/Home.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./RecipeCard";
import Tips from "./Tips";
import "../styles/newHome.css";
import { toast } from "react-toastify";
import { ChevronRight, ChevronLeft, ArrowRight, ChefHat, Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

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

// Props for Home component
interface HomeProps {
  searchTerm: string;
  sortType: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const Home: React.FC<HomeProps> = ({ searchTerm, sortType }) => {
  // State for recipes, loading, and pagination
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch recipes when search or sort changes
  useEffect(() => {
    fetchRecipes(1);
  }, [searchTerm, sortType]);

  // Fetch recipes from backend with pagination and search/sort
  const fetchRecipes = async (page: number) => {
    try {
      setLoading(true);
      // Build API URL
      let url = "/api/recipes";
      if (sortType) url = `/api/recipes/sort/${sortType}`;
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (searchTerm) params.append('search', searchTerm);
      params.append('_t', Date.now().toString()); // Prevent caching
      const finalUrl = `${API_URL}${url}?${params.toString()}`;
      // Fetch recipes
      const response = await axios.get(finalUrl);
      const data = response.data;
      // Parse response
      const recipesList = data.recipes || [];
      const totalPages = data.totalPages || 1;
      const currentPage = data.currentPage || 1;
      // Fetch ingredients and combine with recipes
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
      setTotalPages(totalPages);
      setCurrentPage(currentPage);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.error("Failed to load recipes. Please try again later.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRecipes(page);
    window.scrollTo(0, 0);
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
          <a href="/recipes" className="view-all">
            View all <ArrowRight size={16} />
          </a>
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
        {/* Pagination controls */}
        {!loading && recipes.length > 0 && totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              className="pagination-button"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next
              <ChevronRight size={18} />
            </button>
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
              <Link to="/recipe-generator" className="secondary-cta-btn ai-btn">
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
              <li><a href="/recipes">All Recipes</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/popular">Popular</a></li>
              <li><a href="/latest">Latest</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Information</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Use</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Account</h4>
            <ul>
              <li><a href="/profile">My Profile</a></li>
              <li><a href="/addrecipes">Create Recipe</a></li>
              <li><a href="/favorites">Favorites</a></li>
              <li><a href="/settings">Settings</a></li>
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
