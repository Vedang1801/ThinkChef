import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Star, BookmarkPlus, Printer, Share2, Leaf, Circle, Fish, Egg } from "lucide-react";
import { useAuth } from "../auth/authContext";
import Cookies from "js-cookie";
import { Snackbar } from "@mui/material";
import "../../styles/recipeDetail.css";

// Recipe interface defines the structure of a recipe object
interface Recipe {
  recipe_id: number;
  title: string;
  description: string;
  Instruction?: string;  // Optional: capitalized variant
  instruction?: string;  // Optional: lowercase variant
  instructions?: string; // Optional: plural variant
  image: string;
  created_at: string;
  ingredients?: string[];
  average_rating?: number;
  author?: string;
  total_time?: string;  // Optional: total time
  servings?: string;    // Optional: servings
  cuisine_type?: string;
  dietary_type?: string;
  meal_types?: string[];
  difficulty?: string;
}

// Ingredient interface for each ingredient item
interface Ingredient {
  item: string;
  quantity: string;
}

// Comment interface for each comment
interface Comment {
  comment_id: number;
  comment_text: string;
  username: string;
}

// Fallback image URL if recipe image is missing
const fallbackImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

// API base URL from environment
const API_URL = import.meta.env.VITE_API_URL;

// Main RecipeDetail component for displaying a single recipe's details
const RecipeDetail: React.FC = () => {
  // Get recipe ID from URL params
  const { id } = useParams();
  // State for recipe data
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  // State for ingredients list
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  // Loading state
  const [loading, setLoading] = useState(true);
  // State for comments
  const [comments, setComments] = useState<Comment[]>([]);
  // State for new comment input
  const [commentText, setCommentText] = useState("");
  // State for average rating
  const [rating, setRating] = useState(0);
  // State for user's rating
  const [userRating, setUserRating] = useState(0);
  // Whether user has already rated
  const [userHasRated, setUserHasRated] = useState(false);
  // State for hover effect on rating stars
  const [hoverRating, setHoverRating] = useState(0);
  // Snackbar state for feedback messages
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  // Auth context for login status and user info
  const { loggedIn, user } = useAuth();

  // Fetch recipe data when component mounts or id changes
  useEffect(() => {
    fetchRecipeData();
  }, [id]);

  // Fetch recipe, ingredients, comments, and rating from API
  const fetchRecipeData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch all recipes and find the one matching the id
      const recipeRes = await axios.get(`${API_URL}/api/recipes`);
      const allRecipes = Array.isArray(recipeRes.data.recipes)
        ? recipeRes.data.recipes
        : recipeRes.data;
      const foundRecipe = allRecipes.find((r: Recipe) => String(r.recipe_id) === id);
      if (!foundRecipe) {
        throw new Error("Recipe not found");
      }
      setRecipe(foundRecipe);
      // Fetch ingredients for this recipe
      const ingredientsRes = await axios.get(`${API_URL}/api/recipes/${id}/ingredients`);
      setIngredients(ingredientsRes.data || []);
      // Fetch comments for this recipe
      const commentsRes = await axios.get(`${API_URL}/api/recipes/${id}/comments`);
      setComments(commentsRes.data || []);
      // Fetch average rating for this recipe
      const ratingRes = await axios.get(`${API_URL}/api/recipes/${id}/ratings`);
      setRating(ratingRes.data.averageRating || 0);
      // If logged in, check if user has rated
      if (loggedIn) {
        checkUserRating();
      }
    } catch (error) {
      console.error("Error fetching recipe data:", error);
      // Optionally show error UI or redirect
    } finally {
      setLoading(false);
    }
  };

  // Check if the current user has already rated this recipe
  const checkUserRating = async () => {
    // Only check if user is logged in
    if (!loggedIn || !user) {
      return;
    }

    const token = Cookies.get("token");
    if (!token || !id) return;
    try {
      const response = await axios.get(`${API_URL}/api/recipes/${id}/ratings/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.hasRated) {
        setUserHasRated(true);
        setUserRating(response.data.userRating);
      }
    } catch (error: any) {
      // Silently handle 401 errors (user not authenticated)
      if (error.response?.status !== 401) {
        console.error("Error checking user rating:", error);
      }
    }
  };

  // Handle user clicking a star to rate the recipe
  const handleRatingClick = async (starIndex: number) => {
    if (!loggedIn) {
      setSnackbarMessage("Please log in to rate recipes");
      setSnackbarOpen(true);
      return;
    }
    const token = Cookies.get("token");
    if (!token) {
      setSnackbarMessage("Authentication error. Please log in again.");
      setSnackbarOpen(true);
      return;
    }
    if (userHasRated) {
      setSnackbarMessage("You have already rated this recipe");
      setSnackbarOpen(true);
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/recipes/${id}/ratings/create`,
        {
          rating: starIndex + 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUserHasRated(true);
      setUserRating(starIndex + 1);
      setSnackbarMessage("Rating submitted successfully!");
      setSnackbarOpen(true);
      // Refresh average rating after submitting
      const ratingRes = await axios.get(`${API_URL}/api/recipes/${id}/ratings`);
      setRating(ratingRes.data.averageRating || 0);
    } catch (error) {
      console.error("Error submitting rating:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setSnackbarMessage("Your session has expired. Please log in again.");
        // Optionally trigger logout
      } else {
        setSnackbarMessage("Failed to submit rating. Please try again.");
      }
      setSnackbarOpen(true);
    }
  };

  // Handle submitting a new comment
  const handleCommentSubmit = async () => {
    if (!loggedIn) {
      setSnackbarMessage("Please log in to comment");
      setSnackbarOpen(true);
      return;
    }
    const trimmedComment = commentText.trim();
    if (!trimmedComment) {
      setSnackbarMessage("Comment cannot be empty");
      setSnackbarOpen(true);
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setSnackbarMessage("Authentication error. Please log in again.");
      setSnackbarOpen(true);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/recipes/${id}/comments/create`, {
        comment_text: trimmedComment,
        username: Cookies.get("username"),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCommentText("");
      setSnackbarMessage("Comment added successfully!");
      setSnackbarOpen(true);
      // Refresh comments after adding
      const commentsRes = await axios.get(`${API_URL}/api/recipes/${id}/comments`);
      setComments(commentsRes.data || []);
    } catch (error) {
      console.error("Error adding comment:", error);
      setSnackbarMessage("Failed to add comment");
      setSnackbarOpen(true);
    }
  };

  // Show elegant skeleton loader while fetching data
  if (loading) {
    return (
      <div className="recipe-detail-loading">
        <div className="skeleton-container">
          {/* Back button skeleton */}
          <div className="skeleton skeleton-back"></div>

          {/* Header skeleton */}
          <div className="skeleton-header">
            <div className="skeleton skeleton-image"></div>
            <div className="skeleton-title-area">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-meta"></div>
              <div className="skeleton skeleton-rating"></div>
            </div>
          </div>

          {/* Description skeleton */}
          <div className="skeleton skeleton-description"></div>
          <div className="skeleton skeleton-description-short"></div>

          {/* Info skeleton */}
          <div className="skeleton-info">
            <div className="skeleton skeleton-info-item"></div>
            <div className="skeleton skeleton-info-item"></div>
          </div>

          {/* Content skeleton */}
          <div className="skeleton-content">
            <div className="skeleton-column">
              <div className="skeleton skeleton-heading"></div>
              <div className="skeleton skeleton-list-item"></div>
              <div className="skeleton skeleton-list-item"></div>
              <div className="skeleton skeleton-list-item"></div>
            </div>
            <div className="skeleton-column">
              <div className="skeleton skeleton-heading"></div>
              <div className="skeleton skeleton-paragraph"></div>
              <div className="skeleton skeleton-paragraph"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if recipe not found
  if (!recipe) {
    return (
      <div className="recipe-detail-error">
        <h2>Recipe not found</h2>
        <p>
          The recipe you're looking for might have been removed or doesn't exist.
        </p>
        <Link to="/" className="back-link">
          Back to recipes
        </Link>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="recipe-detail-container">
      {/* Back link to recipe list */}
      <div className="recipe-detail-back">
        <Link to="/" className="back-link">
          ← Back to recipes
        </Link>
      </div>

      {/* Recipe header with image, title, author, date, and actions */}
      <div className="recipe-detail-header">
        <div className="recipe-detail-image-container">
          <img
            src={recipe.image || fallbackImage}
            alt={recipe.title}
            className="recipe-detail-image"
            onError={(e) => {
              e.currentTarget.src = fallbackImage;
            }}
          />
        </div>

        <div className="recipe-detail-title-area">
          <h1 className="recipe-detail-title">{recipe.title}</h1>
          <div className="recipe-detail-meta">
            <div className="recipe-detail-author">
              BY {recipe.author?.toUpperCase() || "ANONYMOUS"}
            </div>
            <div className="recipe-detail-date">
              {formatDate(recipe.created_at)}
            </div>
          </div>

          {/* Average rating display */}
          <div className="recipe-detail-rating-display">
            <div className="rating-number">{Number(rating).toFixed(1)}</div>
            <div className="rating-stars">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  fill={i < Math.round(rating) ? "#ffd54f" : "none"}
                  stroke={i < Math.round(rating) ? "#ffd54f" : "#ccc"}
                />
              ))}
            </div>
            <span className="rating-count">(1)</span>
          </div>

          {/* Dynamic Recipe Tags */}
          <div className="recipe-detail-tags-moved">
            {recipe.cuisine_type && (
              <div className="tag cuisine-tag">
                {recipe.cuisine_type.charAt(0).toUpperCase() + recipe.cuisine_type.slice(1)}
              </div>
            )}
            {recipe.difficulty && (
              <div className="tag difficulty-tag">
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </div>
            )}
            {recipe.dietary_type && (
              <div className={`tag dietary-tag ${recipe.dietary_type}`}>
                {(() => {
                  const type = recipe.dietary_type;
                  if (type === 'vegan') return <><Leaf size={14} fill="currentColor" /> Vegan</>;
                  if (type === 'vegetarian') return <><Circle size={14} fill="currentColor" /> Vegetarian</>;
                  if (type === 'non_vegetarian') return <><Circle size={14} fill="currentColor" className="non-veg-icon" /> Non-Veg</>;
                  if (type === 'pescatarian') return <><Fish size={14} /> Pescatarian</>;
                  if (type === 'eggetarian') return <><Egg size={14} /> Eggetarian</>;
                  return type.charAt(0).toUpperCase() + type.slice(1);
                })()}
              </div>
            )}
            {recipe.meal_types && recipe.meal_types.length > 0 && recipe.meal_types.map((type, index) => (
              <div key={index} className="tag meal-tag">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </div>
            ))}
          </div>

          {/* Action buttons: Save, Print, Share */}
          <div className="recipe-detail-actions">
            <button className="action-button">
              <BookmarkPlus size={18} />
              <span>Save</span>
            </button>
            <button className="action-button">
              <Printer size={18} />
              <span>Print</span>
            </button>
            <button className="action-button">
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recipe description section */}
      <div className="recipe-detail-description">
        <p>{recipe.description}</p>
      </div>

      {/* Recipe info: total time and servings */}
      <div className="recipe-detail-info">
        <div className="recipe-info-item">
          <div className="info-label">Total Time</div>
          <div className="info-value">{recipe.total_time || "45 minutes"}</div>
        </div>
        <div className="recipe-info-item">
          <div className="info-label">Servings</div>
          <div className="info-value">{recipe.servings || "4"}</div>
        </div>
      </div>

      {/* Main content: ingredients and instructions */}
      <div className="recipe-detail-content">
        {/* Ingredients column */}
        <div className="recipe-detail-ingredients">
          <h2>Ingredients</h2>
          <ul className="ingredients-list">
            {ingredients.map((ing, i) => (
              <li key={i} className="ingredient-item">
                <span className="ingredient-name">{ing.item}</span>
                {ing.quantity && (
                  <span className="ingredient-quantity">{ing.quantity}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions column */}
        <div className="recipe-detail-instructions">
          <h2>Preparation</h2>
          <div className="instructions-content">
            {/* Show instructions, handling different possible field names */}
            {recipe.Instruction || recipe.instruction || recipe.instructions ? (
              (recipe.Instruction || recipe.instruction || recipe.instructions)?.split("\n").map((paragraph, i) =>
                paragraph.trim() ? (
                  <p key={i} className="instruction-paragraph">
                    {paragraph}
                  </p>
                ) : null
              )
            ) : (
              <p className="instruction-paragraph">No instructions available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Comments section with list and form */}
      <div className="recipe-detail-comments">
        <h2>Comments</h2>
        <div className="comments-list">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.comment_id} className="comment-item">
                <div className="comment-author">{comment.username}</div>
                <div className="comment-text">{comment.comment_text}</div>
              </div>
            ))
          ) : (
            <p className="no-comments">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
        {loggedIn ? (
          <div className="comment-form">
            <textarea
              placeholder="Add your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="comment-input"
            />
            <button onClick={handleCommentSubmit} className="comment-submit">
              Post Comment
            </button>
          </div>
        ) : (
          <div className="login-prompt">
            <p>
              Please{" "}
              <Link to="/login" className="login-link">
                log in
              </Link>{" "}
              to leave a comment.
            </p>
          </div>
        )}
      </div>

      {/* User rating section: allow user to rate if not already rated */}
      <div className="recipe-detail-user-rating">
        <h3>Rate this Recipe</h3>
        <div className="user-rating-stars">
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={`user-star ${index < userRating ? "active" : ""
                } ${index < hoverRating ? "hover" : ""}`}
              onMouseEnter={() => !userHasRated && setHoverRating(index + 1)}
              onMouseLeave={() => !userHasRated && setHoverRating(0)}
              onClick={() => !userHasRated && handleRatingClick(index)}
            >
              ★
            </span>
          ))}
        </div>
        {userHasRated ? (
          <div className="rating-message">
            Thank you for rating this recipe!
          </div>
        ) : (
          <div className="rating-message">
            Click on a star to rate this recipe
          </div>
        )}
      </div>

      {/* Snackbar for feedback messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </div>
  );
};

export default RecipeDetail;


