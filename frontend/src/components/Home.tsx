// File: src/components/Home.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./RecipeCard";
import Tips from "./Tips";
import "../styles/newHome.css";
import { toast } from "react-toastify";
import { ChevronRight, ChevronLeft, ArrowRight, ChefHat, Facebook, Twitter, Instagram } from "lucide-react";

// Update the interface to match what the database actually returns
interface Recipe {
  recipe_id: number;
  title: string;
  description: string;
  user_id: number;
  image: string;
  created_at: string;
  instruction: string; // Changed to lowercase to match database column
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRecipes(1); // Reset to page 1 when search or sort changes
  }, [searchTerm, sortType]);

  const fetchRecipes = async (page: number) => {
    try {
      setLoading(true);
      
      // Build the URL based on whether we're sorting or not
      let url = "/api/recipes";
      if (sortType) url = `/api/recipes/sort/${sortType}`;
      
      // Add query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (searchTerm) params.append('search', searchTerm);
      
      // Add a timestamp to prevent caching issues
      params.append('_t', Date.now().toString());
      
      const finalUrl = `${url}?${params.toString()}`;
      console.log(`Fetching recipes from: ${finalUrl}`); // Debug URL
      
      const response = await axios.get(finalUrl);
      const data = response.data;
      
      // Log the pagination data
      console.log(`Received ${data.recipes?.length || 0} recipes`);
      console.log(`Page ${data.currentPage} of ${data.totalPages}, Limit: ${data.limit}`);
      
      // Ensure we're handling the response format correctly
      const recipesList = data.recipes || data;
      const totalPages = data.totalPages || 1;
      const currentPage = data.currentPage || 1;
      
      // Get ingredients data
      const ingredientsResponse = await axios.get("/api/ingredients");
      const ingredientsData = ingredientsResponse.data;

      // Combine recipes with their ingredients & filter invalid recipes
      const combinedRecipes: Recipe[] = recipesList
        .filter((recipe: any) => recipe && recipe.recipe_id) // Filter out invalid recipes
        .map((recipe: Recipe) => {
          const ingredients = ingredientsData
            .filter((ingredient: any) => ingredient.recipe_id === recipe.recipe_id)
            .map((ingredient: any) => `${ingredient.item}: ${ingredient.quantity}`);
          return { ...recipe, ingredients };
        });

      setRecipes(combinedRecipes);
      setTotalPages(totalPages);
      setCurrentPage(currentPage);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast.error("Failed to load recipes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRecipes(page);
    window.scrollTo(0, 0); // Scroll to top when changing pages
  };

  return (
    <div className="homepage-root">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Delicious Recipes</h1>
          <p>
            Find your next favorite recipe or share your own culinary creations with our community of food lovers.
          </p>
          <a href="/addrecipes" className="cta-btn">Create Recipe</a>
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
        
        {loading ? (
          <div className="loading-spinner">Loading recipes...</div>
        ) : (
          <>
            <div className="epicurious-recipe-grid">
              {recipes.length === 0 ? (
                <p className="no-recipes-message">No recipes found matching your search.</p>
              ) : (
                recipes.map((recipe) => (
                  <RecipeCard key={recipe.recipe_id} recipe={recipe} />
                ))
              )}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
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
          </>
        )}
      </section>
      
      {/* Promotional Banner - Between Recipe and Tips */}
      <div className="promo-section">
        <div className="promo-container">
          <div className="promo-banner">
            <h3>Ready to Share Your Recipe?</h3>
            <p>Join our community and showcase your culinary creations with food enthusiasts worldwide.</p>
            <a href="/addrecipes" className="secondary-cta-btn">Create Recipe</a>
          </div>
        </div>
      </div>

      {/* Tips Section - At Bottom */}
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
