import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";

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

const fallbackImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  // Set loading state when image loads
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

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [recipe.image]);

  // Navigate to the detail page when clicked
  const handleClick = () => {
    if (!recipe || !recipe.recipe_id) return;
    navigate(`/recipes/${recipe.recipe_id}`);
  };

  // Format the rating to one decimal place
  const formattedRating = Number(recipe.average_rating || 0).toFixed(1);
  
  // Render stars for the rating
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

  if (!recipe || !recipe.title) {
    return null; // Don't render invalid recipe cards
  }

  return (
    <div className="epicurious-recipe-card" onClick={handleClick}>
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
        <div className="epicurious-recipe-category">
          RECIPES & MENUS
        </div>
        <h2 className="epicurious-recipe-title">{recipe.title || "Untitled Recipe"}</h2>
        <div className="epicurious-recipe-rating">
          {renderRatingStars(recipe.average_rating || 0)}
          <span className="rating-value">{formattedRating}</span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;