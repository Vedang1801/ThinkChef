import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Star, BookmarkPlus, Printer, Share2 } from "lucide-react";
import { useAuth } from "./authContext";
import Cookies from "js-cookie";
import { Snackbar } from "@mui/material";
import "../styles/recipeDetail.css";

interface Recipe {
  recipe_id: number;
  title: string;
  description: string;
  Instruction?: string;  // Make this optional
  instruction?: string;  // Add lowercase variant
  instructions?: string; // Add plural variant
  image: string;
  created_at: string;
  ingredients?: string[];
  average_rating?: number;
  author?: string;
  total_time?: string;  // Add these fields
  servings?: string;
}

interface Ingredient {
  item: string;
  quantity: string;
}

interface Comment {
  comment_id: number;
  comment_text: string;
  username: string;
}

const fallbackImage =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80";

const API_URL = import.meta.env.VITE_API_URL;

const RecipeDetail: React.FC = () => {
  const { id } = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userHasRated, setUserHasRated] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { loggedIn } = useAuth();

  useEffect(() => {
    fetchRecipeData();
  }, [id]);

  const fetchRecipeData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Fetch recipe data
      const recipeRes = await axios.get(`${API_URL}/api/recipes`);
      const allRecipes = Array.isArray(recipeRes.data.recipes)
        ? recipeRes.data.recipes
        : recipeRes.data;
      const foundRecipe = allRecipes.find((r: Recipe) => String(r.recipe_id) === id);

      if (!foundRecipe) {
        throw new Error("Recipe not found");
      }

      setRecipe(foundRecipe);

      // Fetch ingredients
      const ingredientsRes = await axios.get(`${API_URL}/api/recipes/${id}/ingredients`);
      setIngredients(ingredientsRes.data || []);

      // Fetch comments
      const commentsRes = await axios.get(`${API_URL}/api/recipes/${id}/comments`);
      setComments(commentsRes.data || []);

      // Fetch rating
      const ratingRes = await axios.get(`${API_URL}/api/recipes/${id}/ratings`);
      setRating(ratingRes.data.averageRating || 0);

      // Check if user has rated this recipe
      if (loggedIn) {
        checkUserRating();
      }
    } catch (error) {
      console.error("Error fetching recipe data:", error);
      // Consider redirecting to 404 page or showing error message
    } finally {
      setLoading(false);
    }
  };

  const checkUserRating = async () => {
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
    } catch (error) {
      console.error("Error checking user rating:", error);
      // Don't set userHasRated to false here - it may cause UI issues
      // if the API call fails but the user has actually rated
    }
  };

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
          user_id: Cookies.get("user_id"),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Make sure token is correctly formatted
          },
        }
      );

      setUserHasRated(true);
      setUserRating(starIndex + 1);
      setSnackbarMessage("Rating submitted successfully!");
      setSnackbarOpen(true);

      // Refresh rating data
      const ratingRes = await axios.get(`${API_URL}/api/recipes/${id}/ratings`);
      setRating(ratingRes.data.averageRating || 0);
    } catch (error) {
      console.error("Error submitting rating:", error);
      // Check if it's a token expiration and handle accordingly
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setSnackbarMessage("Your session has expired. Please log in again.");
        // You may want to trigger a logout here
        // logout();
      } else {
        setSnackbarMessage("Failed to submit rating. Please try again.");
      }
      setSnackbarOpen(true);
    }
  };

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

    try {
      await axios.post(`${API_URL}/api/recipes/${id}/comments/create`, {
        comment_text: trimmedComment,
        user_id: Cookies.get("user_id"),
        username: Cookies.get("username"),
      });

      setCommentText("");
      setSnackbarMessage("Comment added successfully!");
      setSnackbarOpen(true);

      // Refresh comments
      const commentsRes = await axios.get(`${API_URL}/api/recipes/${id}/comments`);
      setComments(commentsRes.data || []);
    } catch (error) {
      console.error("Error adding comment:", error);
      setSnackbarMessage("Failed to add comment");
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="recipe-detail-loading">
        <div className="loading-spinner">Loading recipe...</div>
      </div>
    );
  }

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
      {/* Back link */}
      <div className="recipe-detail-back">
        <Link to="/" className="back-link">
          ← Back to recipes
        </Link>
      </div>

      {/* Recipe header with image */}
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

      {/* Recipe description */}
      <div className="recipe-detail-description">
        <p>{recipe.description}</p>
      </div>

      {/* Recipe info */}
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

      {/* Recipe content */}
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

      {/* Comments section */}
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

      {/* User Rating Section */}
      <div className="recipe-detail-user-rating">
        <h3>Rate this Recipe</h3>
        <div className="user-rating-stars">
          {[...Array(5)].map((_, index) => (
            <span
              key={index}
              className={`user-star ${
                index < userRating ? "active" : ""
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

      {/* Tags */}
      <div className="recipe-detail-tags">
        <div className="tag">Dinner</div>
        <div className="tag">Main</div>
        <div className="tag">Healthy</div>
      </div>

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


