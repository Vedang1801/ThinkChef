// File: src/components/Home.tsx
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
}

interface HomeProps {
  searchTerm: string;
  sortType: string;
}

const Home: React.FC<HomeProps> = ({ searchTerm, sortType }) => {
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRecipes(currentPage);
  }, [currentPage]);

  // Update this useEffect to directly call fetchRecipes without searchTerm check
  useEffect(() => {
    // Reset to page 1 when search term changes
    setCurrentPage(1);
    fetchRecipes(1, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    if (sortType) {
      handleSort(sortType);
    }
  }, [sortType]);

  // Update the fetchRecipes function
  const fetchRecipes = async (page: number, search?: string) => {
    try {
      const searchQuery = search ? `&search=${encodeURIComponent(search)}` : '';
      const recipesResponse = await axios.get(`/api/recipes?page=${page}${searchQuery}`);
      const ingredientsResponse = await axios.get("/api/ingredients");

      const recipesData = recipesResponse.data.recipes;
      const ingredientsData = ingredientsResponse.data;

      const combinedRecipes: Recipe[] = recipesData.map((recipe: Recipe) => {
        const ingredients = ingredientsData
          .filter((ingredient: any) => ingredient.recipe_id === recipe.recipe_id)
          .map((ingredient: any) => `${ingredient.item}: ${ingredient.quantity}`);
        return {
          ...recipe,
          ingredients,
        };
      });

      // Remove the setRecipes call and just set filteredRecipes
      setFilteredRecipes(combinedRecipes);
      setTotalPages(recipesResponse.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching recipes and ingredients:", error);
      toast.error("Failed to load recipes. Please try again later.");
      setLoading(false);
    }
  };

  // Update the handleSort function
  const handleSort = async (sortType: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/recipes/sort/${sortType}`);
      const sortedRecipes = response.data;
      
      // Fetch ingredients for sorted recipes
      const ingredientsResponse = await axios.get("/api/ingredients");
      const ingredientsData = ingredientsResponse.data;

      // Combine recipes with their ingredients
      const combinedRecipes: Recipe[] = sortedRecipes.map((recipe: Recipe) => {
        const ingredients = ingredientsData
          .filter((ingredient: any) => ingredient.recipe_id === recipe.recipe_id)
          .map((ingredient: any) => `${ingredient.item}: ${ingredient.quantity}`);
        return {
          ...recipe,
          ingredients,
        };
      });

      // Remove the setRecipes call and just set filteredRecipes
      setFilteredRecipes(combinedRecipes);
    } catch (error) {
      console.error('Error sorting recipes:', error);
      toast.error("Failed to sort recipes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="home-container">
      <div className="home-background"></div>
      
      {/* Main Content Section */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">RECIPES</h1>
            <p className="hero-subtitle">Discover & Share Amazing Recipes</p>
          </div>
        </section>

        {/* Add loading indicator */}
        {loading && <div className="loading-spinner">Loading recipes...</div>}

        {/* Recipes Grid Section */}
        <section className="recipes-section">
          <div className="recipes-grid">
            {!loading && filteredRecipes.length === 0 ? (
              <p className="no-recipes-message">No recipes found.</p>
            ) : (
              filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.recipe_id} recipe={recipe} />
              ))
            )}
          </div>
        </section>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <section className="pagination-section">
            <div className="pagination-container">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Tips Section */}
      <section className="tips-section">
        <Tips />
      </section>
    </div>
  );
};

export default Home;
