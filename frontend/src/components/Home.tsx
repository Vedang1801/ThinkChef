// File: src/components/Home.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./RecipeCard";
import Tips from "./Tips";
import "../styles/newHome.css";
import { toast } from "react-toastify";
import { ChevronRight, ChevronLeft } from "lucide-react";

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
          <>
            <div className="epicurious-recipe-grid">
              {recipes.length === 0 ? (
                <p className="no-recipes-message">No recipes found.</p>
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
                  <ChevronLeft size={20} />
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
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
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
