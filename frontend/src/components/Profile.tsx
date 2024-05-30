import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";
import RecipeCard from "./RecipeCard";

interface Post {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  user_id: number;
  image: string;
  created_at: Date;
  ingredients: string[]; // Modified to include ingredients
}

const Profile = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Post | null>(null);
  const [isRecipeWidgetOpen, setIsRecipeWidgetOpen] = useState(false);

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
    }
  }, [loggedIn, navigate]);

  useEffect(() => {
    fetchPosts();
  }, [loggedIn]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`/api/recipes/${Cookies.get("user_id")}`);
      const postsData = await Promise.all(response.data.map(async (post) => {
        const ingredientsResponse = await axios.get(`/api/recipes/${post.recipe_id}/ingredients`);
        console.log("Ingredients response:", ingredientsResponse.data); // Log ingredients data
        const ingredientsData = ingredientsResponse.data.map(ingredient => ingredient.item); // Extract 'item' property
        console.log("Ingredients data:", ingredientsData); // Log processed ingredients data
        return { ...post, ingredients: ingredientsData };
      }));
      console.log("Posts data:", postsData); // Log updated posts data
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  
  
  const handleDelete = (event, postId: number) => {
    event.stopPropagation(); // Add this line to prevent event bubbling
    setPendingDelete(postId);
    setCountdown(5);
    toast.info("Post will be permanently deleted in 5 seconds");

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
        }
        return prev - 1;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      handlePermanentDelete(postId);
      clearInterval(countdownInterval);
      setPendingDelete(null);
    }, 5000);
    setUndoTimeout(timeout);
  };

  const handlePermanentDelete = async (postId: number) => {
    try {
      await axios.delete(`/api/recipes/delete/${postId}`);
      setPosts(posts.filter((post) => post.recipe_id !== postId));
      toast.success("Post permanently deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Error deleting post");
    }
    setPendingDelete(null);
  };

  const handleUndo = (event) => {
    event.stopPropagation(); // Add this line to prevent event bubbling
    if (pendingDelete !== null) {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
      setPendingDelete(null);
      toast.success("Post Restored");
    }
  };

  const handleRecipeClick = (recipe: Post) => {
    setSelectedRecipe(recipe);
    setIsRecipeWidgetOpen(true);
  };

  const handleCloseWidget = () => {
    setSelectedRecipe(null);
    setIsRecipeWidgetOpen(false);
  };

  return (
    <div className="home-container">
      {isRecipeWidgetOpen && <div className="backdrop" onClick={handleCloseWidget}></div>}
      <div className={`blur-background ${isRecipeWidgetOpen ? "blur" : ""}`}>
        <div className="profile-background"></div>
        <div className="container mx-auto px-4 py-8">
          <div className="centered-container">
            <div className="profile-box">
              <h2 className="profileboxtitle">PROFILE</h2>
            </div>
          </div>
          <div className="profile-container">
            <div className="profile-field">
              <label className="profile-label">Username:</label>
              <span className="profile-text">{Cookies.get("username")}</span>
            </div>
            <div className="profile-field">
              <label className="profile-label">Email:</label>
              <span className="profile-text">{Cookies.get("email")}</span>
            </div>
          </div>
          
          <div className="post-grid">
            {posts.map((post) => (
              <div
                key={post.recipe_id}
                className="post-card"
                onClick={() => handleRecipeClick(post)}
              >
                <div className="post-image-container">
                  <img src={post.image} alt={post.title} className="post-image" />
                </div>
                <div className="post-content">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-description">{post.description}</p>
                  {pendingDelete === post.recipe_id ? (
                   <button onClick={(event) => handleUndo(event)} className="undo-button">
                   Undo ({countdown})
                 </button>
                  ) : (
                    <button
                    onClick={(event) => handleDelete(event, post.recipe_id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {selectedRecipe && (
        <div className="recipe-widget-container">
          <button className="close-button" onClick={handleCloseWidget}>&times;</button>
          <RecipeCard
            recipe={{
              recipe_id: selectedRecipe.recipe_id,
              title: selectedRecipe.title,
              Instruction: selectedRecipe.Instruction,
              description: selectedRecipe.description,
              ingredients: selectedRecipe.ingredients,
              image: selectedRecipe.image,
              created_at:
                typeof selectedRecipe.created_at === "string"
                  ? selectedRecipe.created_at
                  : selectedRecipe.created_at.toISOString(),
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Profile;
