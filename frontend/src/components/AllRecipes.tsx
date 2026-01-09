// AllRecipes.tsx - Dedicated page for browsing all recipes
import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "./recipe/RecipeCard";
import { ChevronRight, ChevronLeft } from "lucide-react";
import "../styles/newHome.css";

// Recipe interface
interface Recipe {
    recipe_id: number;
    title: string;
    description: string;
    user_id: number;
    image: string;
    created_at: string;
    instruction: string;
    ingredients?: string[];
    average_rating?: number;
    author?: string;
}

// Props for AllRecipes component
interface AllRecipesProps {
    searchTerm: string;
    sortType: string;
    filters?: {
        cuisine: string;
        dietary: string;
        meal: string;
        difficulty: string;
    };
}

const API_URL = import.meta.env.VITE_API_URL;

const AllRecipes: React.FC<AllRecipesProps> = ({
    searchTerm,
    sortType,
    filters = { cuisine: '', dietary: '', meal: '', difficulty: '' }
}) => {
    // State for recipes, loading, and pagination
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Fetch filtered recipes
    const fetchRecipesWithFilters = async (page: number) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', page.toString());

            if (filters.cuisine) params.append('cuisine', filters.cuisine);
            if (filters.dietary) params.append('dietary', filters.dietary);
            if (filters.meal) params.append('meal', filters.meal);
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (searchTerm) params.append('search', searchTerm);

            const hasFilters = filters.cuisine || filters.dietary || filters.meal || filters.difficulty;
            const url = hasFilters ? '/api/recipes/filter' : '/api/recipes';

            const finalUrl = `${API_URL}${url}?${params.toString()}`;
            const response = await axios.get(finalUrl);
            const data = response.data;

            const recipesList = data.recipes || [];
            const totalPages = data.totalPages || 1;
            const currentPage = data.currentPage || 1;

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
            console.error('Error fetching filtered recipes:', error);
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch recipes on initial mount
    useEffect(() => {
        fetchRecipes(1);
    }, []);

    // Fetch recipes when search, sort, or filters change
    useEffect(() => {
        const hasFilters = filters.cuisine || filters.dietary || filters.meal || filters.difficulty;
        if (hasFilters) {
            fetchRecipesWithFilters(1);
        } else {
            fetchRecipes(1);
        }
    }, [searchTerm, sortType, filters]);

    // Fetch recipes from backend with pagination and search/sort
    const fetchRecipes = async (page: number) => {
        try {
            setLoading(true);
            let url = "/api/recipes";
            if (sortType) url = `/api/recipes/sort/${sortType}`;
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (searchTerm) params.append('search', searchTerm);
            params.append('_t', Date.now().toString());
            const finalUrl = `${API_URL}${url}?${params.toString()}`;

            const response = await axios.get(finalUrl);
            const data = response.data;

            const recipesList = data.recipes || [];
            const totalPages = data.totalPages || 1;
            const currentPage = data.currentPage || 1;

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
            setRecipes([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const hasActiveFilters = filters.cuisine || filters.dietary || filters.meal || filters.difficulty;
        if (hasActiveFilters) {
            fetchRecipesWithFilters(page);
        } else {
            fetchRecipes(page);
        }
        window.scrollTo(0, 0);
    };

    return (
        <div className="homepage-root">
            {/* Page Header */}
            <section className="all-recipes-header">
                <div className="container">
                    <h1 className="page-title">All Recipes</h1>
                    <p className="page-subtitle">
                        Explore our complete collection of delicious recipes
                    </p>
                </div>
            </section>

            {/* Recipes Section */}
            <section className="featured-section">
                <div className="container">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loader"></div>
                            <div className="loading-text">Loading Recipes...</div>
                        </div>
                    ) : recipes.length === 0 ? (
                        <div className="empty-state">
                            <h2>No recipes found</h2>
                            <p>Try adjusting your filters or search term</p>
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
                </div>
            </section>
        </div>
    );
};

export default AllRecipes;
