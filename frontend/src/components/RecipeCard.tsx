import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "./authContext";
import { Link } from "react-router-dom";
import { Snackbar } from "@mui/material";
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
    Instruction: string;
    description: string;
    ingredients: string[] | undefined;
    image: string;
    created_at: string;
  };
}

interface Comment {
  comment_id: number;
  comment_text: string;
  username: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [rating, setRating] = useState(0);
  const [userHasRated, setUserHasRated] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [showThankYouSnackbar, setShowThankYouSnackbar] = useState(false);
  const { user, loggedIn } = useAuth();

  useEffect(() => {
    fetchComments();
    fetchRating();
  }, [recipe.recipe_id]);

  useEffect(() => {
    if (loggedIn) {
      checkIfUserHasRated();
      fetchUserRating(); // New API call to fetch user rating
    } else {
      resetUserRatingState();
    }
  }, [user, loggedIn, recipe.recipe_id]);

  const fetchUserRating = async () => {
    try {
      const response = await axios.get(
        `/api/recipes/${recipe.recipe_id}/ratings/user`,
        { headers: { Authorization: `Bearer ${Cookies.get("token")}` } }
      );
      if (response.data.hasRated) {
        setUserRating(response.data.userRating);
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    }
  };

  const resetUserRatingState = () => {
    setUserHasRated(false);
    setUserRating(0);
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `/api/recipes/${recipe.recipe_id}/comments`
      );
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchRating = async () => {
    try {
      const response = await axios.get(
        `/api/recipes/${recipe.recipe_id}/ratings`
      );
      setRating(response.data.averageRating);
    } catch (error) {
      console.error("Error fetching rating:", error);
    }
  };

  const checkIfUserHasRated = async () => {
    const userId = Cookies.get("user_id");
    if (!userId) {
      setUserHasRated(false);
      return;
    }

    try {
      const response = await axios.get(
        `/api/recipes/${recipe.recipe_id}/ratings/user`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );
      if (response.data.hasRated) {
        setUserHasRated(true);
        setUserRating(response.data.userRating);
      } else {
        setUserHasRated(false);
        setUserRating(0);
      }
    } catch (error) {
      console.error("Error checking if user has rated:", error);
      setUserHasRated(false);
      setUserRating(0);
    }
  };

  const handleCommentSubmit = async () => {
    try {
      await axios.post(`/api/recipes/${recipe.recipe_id}/comments/create`, {
        comment_text: commentText,
        user_id: Cookies.get("user_id"),
        username: Cookies.get("username"),
      });
      setCommentText("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleRatingClick = async (starIndex: number) => {
    const userId = Cookies.get("user_id");
    if (!userId) {
      setSnackbarMessage("Please log in to rate a recipe.");
      setSnackbarOpen(true);
      return;
    }

    if (userHasRated) {
      setSnackbarMessage(
        "You have already rated this recipe and cannot change your rating."
      );
      setSnackbarOpen(true);
      return;
    }

    try {
      await axios.post(
        `/api/recipes/${recipe.recipe_id}/ratings/create`,
        {
          rating: starIndex + 1,
          user_id: userId,
        },
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );
      setUserHasRated(true);
      setUserRating(starIndex + 1);
      setSnackbarMessage("Rating submitted successfully.");
      setSnackbarOpen(true);
      setShowRatingInput(false);
      setShowThankYouSnackbar(true); // Show the thank you snackbar
      fetchRating(); // Fetch updated average rating
    } catch (error) {
      console.error("Error submitting rating:", error);
      setSnackbarMessage("An error occurred while rating the recipe.");
      setSnackbarOpen(true);
    }
  };

  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(userRating || rating); // Use userRating if available, otherwise fallback to average rating
    const hasHalfStar = (userRating || rating) - fullStars >= 0.5; // Use userRating if available, otherwise fallback to average rating
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      <div className="rating-stars">
        {[...Array(fullStars)].map((_, index) => (
          <span key={`full-${index}`} className="star golden">
            {" "}
            &#9733;{" "}
          </span>
        ))}
        {hasHalfStar && <span className="star half-golden">&#9733;</span>}
        {[...Array(emptyStars)].map((_, index) => (
          <span key={`empty-${index}`} className="star">
            {" "}
            &#9733;{" "}
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <>
      <div className="recipe-card">
        <div className="recipe-image">
          <img src={recipe.image} alt={recipe.title} />
        </div>
        <div className="recipe-content">
          <h2 className="recipe-title">{recipe.title}</h2>
          <p className="recipe-description">{recipe.description}</p>
          <div className="recipe-details">
            <div className="recipe-instructions">
              <h3>Instructions</h3>
              <p>{recipe.Instruction}</p>
            </div>
            <div className="recipe-ingredients">
              <h3>Ingredients</h3>
              <ul>
                {recipe?.ingredients?.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="recipe-comments">
            <h3>Comments</h3>
            {loggedIn ? (
              <>
                <ul>
                  {comments.map((comment) => (
                    <li key={comment.comment_id}>
                      <b>{comment.username}</b>: {comment.comment_text}
                    </li>
                  ))}
                </ul>
                <div className="comment-input">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button onClick={handleCommentSubmit}>ADD</button>
                </div>
              </>
            ) : (
              <Link to="/login">
                <p>Please Login to Add Comments</p>
              </Link>
            )}
          </div>
          <div className="recipe-rating">
            <h3>Rate this recipe:</h3>
            {showRatingInput ? (
              <div className="rating-stars">
                {[...Array(5)].map((_, index) => (
                  <span
                    key={index}
                    className={`star ${index < userRating ? "golden" : ""}`}
                    onClick={() => handleRatingClick(index)}
                  >
                    &#9733;
                  </span>
                ))}
              </div>
            ) : (
              <p
                className="rate-prompt"
                onClick={() => setShowRatingInput(true)}
              >
                Click Here To Rate
              </p>
            )}
            <div className="rating-circle">{Number(rating).toFixed(1)}</div>
          </div>

          <p className="recipe-date">{formatDate(recipe.created_at)}</p>
        </div>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      />
      <Snackbar
        open={showThankYouSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowThankYouSnackbar(false)}
        message="Thank you for rating!"
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      />
    </>
  );
};

export default RecipeCard;
