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

interface Post {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  user_id: number;
  image: string;
  created_at: Date;
}

const Profile = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login"); // Redirect to login if user is not logged in
    }
  }, [loggedIn, navigate]);

  useEffect(() => {
    fetchPosts();
  }, [loggedIn]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(
        `/api/recipes/${Cookies.get("user_id")}`
      );
      setPosts(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Handle error
    }
  };

  const handleDelete = (postId: number) => {
    setPendingDelete(postId);
    setCountdown(5); // Reset countdown to 5 seconds
    toast.info("Post will be permanently deleted in 5 seconds"); // Display a toast notification

    // Start the countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
        }
        return prev - 1;
      });
    }, 1000);

    // Set a timeout to permanently delete the post after 5 seconds
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

  const handleUndo = () => {
    if (pendingDelete !== null) {
      // Clear the countdown timer
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
      setPendingDelete(null);
      toast.success("Post Restored");
    }
  };

  return (
    <div className="home-container">
      <div className="profile-background"></div>
      <div className="container mx-auto px-4 py-8">
        <div className="centered-container">
          <div className="profile-box">
            <h2 className="text-3xl font-semibold mb-4">Profile</h2>
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
            <div key={post.recipe_id} className="post-card">
              <div className="post-image-container">
                <img src={post.image} alt={post.title} className="post-image" />
              </div>
              <div className="post-content">
                <h3 className="post-title">{post.title}</h3>
                <p className="post-description">{post.description}</p>
                {pendingDelete === post.recipe_id ? (
                  <button onClick={handleUndo} className="undo-button">
                    Undo ({countdown})
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(post.recipe_id)}
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
  );
};

export default Profile;
