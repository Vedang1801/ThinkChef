import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";

// Props for RecipeCard: expects a recipe object
interface RecipeCardProps {
  recipe: {
    recipe_id: number;
    title: string;
    description: string;
    Instruction?: string;
    image: string;
    created_at: string;
    ingredients?: string[];
    average_rating?: number;
    author?: string;
  };
}

// Fallback image if recipe image fails to load
const fallbackImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

// RecipeCard displays a summary card for a recipe
const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  // Loading state for image
  const [loading, setLoading] = useState(true);
  // Track if image failed to load
  const [imageError, setImageError] = useState(false);
  // Navigation hook
  const navigate = useNavigate();

  // Preload image and handle loading/error states
  useEffect(() => {
    if (!recipe.image) {
      setImageError(true);
      setLoading(false);
      return;
    }

    const img = new Image();
    img.src = recipe.image;
    img.onload = () => setLoading(false);
    img.onerror = () => {
      setImageError(true);
      setLoading(false);
    };

    // Cleanup listeners on unmount
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [recipe.image]);

  // Navigate to recipe detail page on card click
  const handleClick = () => {
    if (!recipe || !recipe.recipe_id) return;
    navigate(`/recipes/${recipe.recipe_id}`);
  };

  // Format the average rating to one decimal place
  const formattedRating = Number(recipe.average_rating || 0).toFixed(1);

  // Render star icons for the recipe's rating
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.round(rating || 0);
    return (
      <div className="recipe-card-stars">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            fill={i < fullStars ? "#ffd54f" : "none"}
            stroke={i < fullStars ? "#ffd54f" : "#ccc"}
          />
        ))}
      </div>
    );
  };

  // Don't render if recipe is invalid
  if (!recipe || !recipe.title) {
    return null;
  }

  return (
    <div className="epicurious-recipe-card" onClick={handleClick}>
      {/* Recipe image with fallback and loading state */}
      <div className="epicurious-recipe-image">
        <img
          src={imageError || !recipe.image ? fallbackImage : recipe.image}
          alt={recipe.title || "Recipe"}
          onError={(e) => {
            e.currentTarget.src = fallbackImage;
            setImageError(true);
          }}
          className={loading ? "loading" : ""}
        />
      </div>
      <div className="epicurious-recipe-content">
        {/* Static category label */}
        <div className="epicurious-recipe-category">
          RECIPES & MENUS
        </div>
        {/* Recipe title */}
        <h2 className="epicurious-recipe-title">{recipe.title || "Untitled Recipe"}</h2>
        {/* Recipe rating stars and value */}
        <div className="epicurious-recipe-rating">
          {renderRatingStars(recipe.average_rating || 0)}
          <span className="rating-value">{formattedRating}</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;