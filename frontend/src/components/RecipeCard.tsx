import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "./authContext";
import { Link } from "react-router-dom";
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
    ingredients: string[];
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
  const { user, loggedIn } = useAuth();

  useEffect(() => {
    fetchComments();
  }, []);

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

  return (
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
              {recipe.ingredients.map((ingredient, index) => (
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
        <p className="recipe-date">{recipe.created_at.slice(0, 10)}</p>
      </div>
    </div>
  );
};

export default RecipeCard;