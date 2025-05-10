import React, { useState, useEffect } from "react";
import { useAuth } from "./authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { 
  Edit2, Trash2, RefreshCw, Plus, Clock, User, Bookmark, Settings, 
  Calendar, ArrowRight, ChevronLeft, ChevronRight, Grid, List, Heart,
  X, Save, Upload, Loader2, ChefHat
} from "lucide-react";
import "../styles/profile.css";

interface Post {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  user_id: number;
  image: string;
  created_at: Date | string;
  ingredients: string[];
  totalTime?: string;
  servings?: string;
}

interface Ingredient {
  item: string;
  quantity: string;
}

interface EditingRecipe {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  instruction?: string;
  instructions?: string;
  ingredients: Ingredient[];
  image: string | File;
  totalTime: string;
  servings: string;
}

// Updated fallback images
const fallbackImage = "https://images.unsplash.com/photo-1588505617603-f80b72bf8f24?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const Profile: React.FC = () => {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<EditingRecipe | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'recipes' | 'stats' | 'settings'>('recipes');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  // Calculate user stats
  const totalRecipes = posts.length;
  const totalIngredients = posts.reduce((acc, post) => acc + (post.ingredients?.length || 0), 0);
  const joinDate = new Date(Cookies.get("created_at") || new Date().toISOString());
  const joinDateFormatted = joinDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
      const postsData = await Promise.all(
        response.data.map(async (post: any) => {
          const ingredientsResponse = await axios.get(
            `/api/recipes/${post.recipe_id}/ingredients`
          );
          const ingredientsData = ingredientsResponse.data.map(
            (ingredient: any) => `${ingredient.item}: ${ingredient.quantity}`
          );
          return { ...post, ingredients: ingredientsData };
        })
      );
      setPosts(postsData);
    } catch (error) {
      setPosts([]);
    }
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>, postId: number) => {
    event.stopPropagation();
    setPendingDelete(postId);
    setCountdown(3);
    toast.info("Recipe will be deleted in 3 seconds", {
      position: "bottom-right",
      autoClose: 3000,
    });

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
    }, 3000);
    setUndoTimeout(timeout);
  };

  const handlePermanentDelete = async (postId: number) => {
    try {
      await axios.delete(`/api/recipes/delete/${postId}`);
      setPosts(posts.filter((post) => post.recipe_id !== postId));
      toast.success("Recipe deleted", { position: "bottom-right" });
    } catch (error) {
      toast.error("Error deleting recipe", { position: "bottom-right" });
    }
    setPendingDelete(null);
  };

  const handleUndo = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (pendingDelete !== null && undoTimeout) {
      clearTimeout(undoTimeout);
      setUndoTimeout(null);
      setPendingDelete(null);
      toast.success("Deletion cancelled", { position: "bottom-right" });
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>, post: Post) => {
    event.stopPropagation();
    setIsEditing(true);
    
    // Store the instructions from whichever field is available
    const instructionContent = post.Instruction || post.instruction || post.instructions || "";
    
    setEditingRecipe({
      recipe_id: post.recipe_id,
      title: post.title,
      description: post.description,
      Instruction: instructionContent, // Always store in the Instruction field for consistency
      ingredients: post.ingredients.map((ingredient) => {
        const [item, quantity] = ingredient.split(": ");
        return { item, quantity };
      }),
      image: post.image,
      totalTime: post.totalTime || "",
      servings: post.servings || "",
    });
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    // Change "file" to the field name expected by multer middleware (likely "image")
    formData.append("image", file);
    
    try {
      setIsUploading(true);
      // Upload to AWS S3 via backend endpoint
      const response = await axios.post("/api/upload-image", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setIsUploading(false);
      if (response.data && response.data.imageUrl) {
        return response.data.imageUrl;
      } else {
        toast.error("Image upload failed", { position: "bottom-right" });
        return null;
      }
    } catch (error) {
      setIsUploading(false);
      toast.error("Image upload failed", { position: "bottom-right" });
      return null;
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingRecipe) return;

    setIsSubmitting(true);
    try {
      // Upload new image if changed
      let imageUrl = editingRecipe.image;
      if (typeof editingRecipe.image === "object") {
        imageUrl = await handleImageUpload(editingRecipe.image);
      }

      if (!imageUrl) {
        setIsSubmitting(false);
        return;
      }

      // Create the data to send to the server
      // Make sure we include both Instruction and instruction fields for compatibility
      const recipeData = {
        ...editingRecipe,
        image: imageUrl,
        Instruction: editingRecipe.Instruction || "",   // Use the capitalized version
        instruction: editingRecipe.Instruction || "",   // Also include lowercase version for compatibility
        instructions: editingRecipe.Instruction || "",  // Also include plural version for compatibility
        ingredients: editingRecipe.ingredients.map((ingredient) => ({
          item: ingredient.item,
          quantity: ingredient.quantity,
        })),
      };

      await axios.put(`/api/recipes/update/${editingRecipe.recipe_id}`, recipeData);

      toast.success("Recipe updated successfully", { position: "bottom-right" });
      setIsEditing(false);
      setEditingRecipe(null);
      fetchPosts();
    } catch (error) {
      toast.error("Error updating recipe", { position: "bottom-right" });
    }
    setIsSubmitting(false);
  };

  // Function to render list view of recipes
  const renderListView = () => (
    <div className="profile-recipes-list">
      {posts.map((post) => (
        <div
          key={post.recipe_id}
          className={`profile-recipe-listitem ${pendingDelete === post.recipe_id ? "deleting" : ""}`}
          onClick={() => navigate(`/recipes/${post.recipe_id}`)}
        >
          <div className="profile-recipe-list-image">
            <img 
              src={post.image || fallbackImage} 
              alt={post.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
          </div>
          <div className="profile-recipe-list-content">
            <h3 className="profile-recipe-list-title">{post.title}</h3>
            <p className="profile-recipe-list-desc">{post.description}</p>
            <div className="profile-recipe-list-meta">
              <span className="profile-recipe-list-date">
                <Calendar size={14} />
                {formatDate(post.created_at)}
              </span>
              <span className="profile-recipe-list-ingredients">
                <Bookmark size={14} />
                {post.ingredients?.length || 0} ingredients
              </span>
            </div>
          </div>
          <div className="profile-recipe-list-actions">
            {pendingDelete === post.recipe_id ? (
              <button
                className="profile-action-btn undo-btn"
                onClick={handleUndo}
                title="Undo"
              >
                <RefreshCw size={16} />
                <span className="action-text">Undo ({countdown})</span>
              </button>
            ) : (
              <>
                <button
                  className="profile-action-btn edit-btn"
                  onClick={(e) => handleEdit(e, post)}
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="profile-action-btn delete-btn"
                  onClick={(e) => handleDelete(e, post.recipe_id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Function to render grid view of recipes
  const renderGridView = () => (
    <div className="profile-recipes-grid">
      {posts.map((post) => (
        <div
          key={post.recipe_id}
          className={`profile-recipe-card ${pendingDelete === post.recipe_id ? "deleting" : ""}`}
          onClick={() => navigate(`/recipes/${post.recipe_id}`)}
        >
          <div className="profile-recipe-card-image">
            <img
              src={post.image || fallbackImage}
              alt={post.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImage;
              }}
            />
            <div className="profile-recipe-card-actions">
              {pendingDelete === post.recipe_id ? (
                <button
                  className="profile-action-btn undo-btn"
                  onClick={handleUndo}
                >
                  <RefreshCw size={16} />
                  <span className="action-text">Undo ({countdown})</span>
                </button>
              ) : (
                <>
                  <button
                    className="profile-action-btn edit-btn"
                    onClick={(e) => handleEdit(e, post)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="profile-action-btn delete-btn"
                    onClick={(e) => handleDelete(e, post.recipe_id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="profile-recipe-card-content">
            <h3 className="profile-recipe-card-title">{post.title}</h3>
            <p className="profile-recipe-card-desc">{post.description}</p>
            <div className="profile-recipe-card-meta">
              <span className="profile-recipe-card-date">
                <Calendar size={14} />
                {formatDate(post.created_at)}
              </span>
              <span className="profile-recipe-card-ingredients">
                <Bookmark size={14} />
                {post.ingredients?.length || 0} ingredients
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render different tab contents
  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div className="profile-stats-container">
            <div className="profile-stat-card">
              <div className="profile-stat-icon recipe-icon">
                <Bookmark size={24} />
              </div>
              <div className="profile-stat-content">
                <h3 className="profile-stat-value">{totalRecipes}</h3>
                <p className="profile-stat-label">Total Recipes</p>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon ingredient-icon">
                <Heart size={24} />
              </div>
              <div className="profile-stat-content">
                <h3 className="profile-stat-value">{totalIngredients}</h3>
                <p className="profile-stat-label">Total Ingredients</p>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon user-icon">
                <Calendar size={24} />
              </div>
              <div className="profile-stat-content">
                <h3 className="profile-stat-value">{joinDateFormatted}</h3>
                <p className="profile-stat-label">Member Since</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="profile-settings-container">
            <div className="profile-setting-group">
              <h3 className="profile-setting-title">Account Settings</h3>
              <p className="profile-setting-description">
                Update your account information and preferences
              </p>
              <button className="profile-setting-btn" onClick={() => toast.info("Feature coming soon!")}>
                Edit Account
              </button>
            </div>
            <div className="profile-setting-group">
              <h3 className="profile-setting-title">Privacy Settings</h3>
              <p className="profile-setting-description">
                Manage your privacy and notification preferences
              </p>
              <button className="profile-setting-btn" onClick={() => toast.info("Feature coming soon!")}>
                Manage Privacy
              </button>
            </div>
            <div className="profile-setting-group danger">
              <h3 className="profile-setting-title">Delete Account</h3>
              <p className="profile-setting-description">
                Permanently delete your account and all your content
              </p>
              <button className="profile-setting-btn danger" onClick={() => toast.info("Feature coming soon!")}>
                Delete Account
              </button>
            </div>
          </div>
        );
      case 'recipes':
      default:
        return (
          <>
            <div className="profile-recipes-header">
              <h2 className="profile-section-title">Your Recipes</h2>
              <div className="profile-view-controls">
                <button 
                  className={`profile-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button 
                  className={`profile-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  title="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
            {posts.length === 0 ? (
              <div className="profile-empty-state">
                <div className="profile-empty-icon">
                  <Bookmark size={48} />
                </div>
                <h3>No recipes yet</h3>
                <p>Start sharing your culinary creations with the world!</p>
                <button
                  className="profile-btn primary-btn"
                  onClick={() => navigate("/addrecipes")}
                >
                  <Plus size={18} />
                  Create Your First Recipe
                </button>
              </div>
            ) : viewMode === 'grid' ? renderGridView() : renderListView()}
          </>
        );
    }
  };

  return (
    <div className="profile-container">
      {/* Profile Header with Cover Photo */}
      <div className="profile-header">
        <div className="profile-cover-photo">
          <img src={fallbackImage} alt="Cover" />
          <div className="profile-cover-gradient" />
        </div>
        
        <div className="profile-header-content">
          <div className="profile-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f3" }}>
            <User size={80} color="#bbb" />
          </div>
          <div className="profile-info">
            <h1 className="profile-username">{Cookies.get("username") || "Chef"}</h1>
            <p className="profile-email">{Cookies.get("email") || ""}</p>
          </div>
          <div className="profile-header-actions">
            <button 
              className="profile-btn primary-btn"
              onClick={() => navigate("/addrecipes")}
            >
              <Plus size={16} />
              New Recipe
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'recipes' ? 'active' : ''}`}
            onClick={() => setActiveTab('recipes')}
          >
            <Bookmark size={18} />
            <span>Recipes</span>
          </button>
          <button 
            className={`profile-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Chart size={18} />
            <span>Stats</span>
          </button>
          <button 
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="profile-content">
        {renderTabContent()}
      </div>

      {/* Edit Recipe Modal */}
      {isEditing && editingRecipe && (
        <div className="profile-edit-modal-overlay">
          <div className="profile-edit-modal">
            <div className="profile-edit-modal-header">
              <h2>Edit Recipe</h2>
              <button 
                className="profile-edit-close-btn" 
                onClick={() => {
                  setIsEditing(false);
                  setEditingRecipe(null);
                }}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="profile-edit-modal-body">
              <div className="form-section">
                <label htmlFor="edit-title" className="form-label">Recipe Title</label>
                <input
                  type="text"
                  id="edit-title"
                  className="form-input"
                  value={editingRecipe.title}
                  onChange={(e) => setEditingRecipe({...editingRecipe, title: e.target.value})}
                  placeholder="Recipe title"
                  required
                />
              </div>
              
              <div className="form-section">
                <label htmlFor="edit-description" className="form-label">Description</label>
                <textarea
                  id="edit-description"
                  className="form-textarea"
                  value={editingRecipe.description}
                  onChange={(e) => setEditingRecipe({...editingRecipe, description: e.target.value})}
                  placeholder="Recipe description"
                  required
                />
              </div>
              
              <div className="form-section">
                <div className="form-row">
                  <div>
                    <label htmlFor="edit-totalTime" className="form-label">Cooking Time</label>
                    <input
                      type="text"
                      id="edit-totalTime"
                      className="form-input"
                      value={editingRecipe.totalTime}
                      onChange={(e) => setEditingRecipe({...editingRecipe, totalTime: e.target.value})}
                      placeholder="e.g. 45 minutes"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-servings" className="form-label">Servings</label>
                    <input
                      type="text"
                      id="edit-servings"
                      className="form-input"
                      value={editingRecipe.servings}
                      onChange={(e) => setEditingRecipe({...editingRecipe, servings: e.target.value})}
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="section-title">Recipe Image</h2>
                <div className="image-upload-container">
                  <div
                    className={`image-dropzone${dragActive ? " drag-active" : ""}`}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setEditingRecipe({...editingRecipe, image: e.dataTransfer.files[0]});
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      id="recipe-image"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setEditingRecipe({...editingRecipe, image: e.target.files[0]});
                        }
                      }}
                      accept="image/*"
                    />
                    {typeof editingRecipe.image === "string" ? (
                      <img
                        src={editingRecipe.image}
                        alt="Recipe Preview"
                        className="image-preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = fallbackImage;
                        }}
                      />
                    ) : editingRecipe.image instanceof File ? (
                      <img
                        src={URL.createObjectURL(editingRecipe.image)}
                        alt="Recipe Preview"
                        className="image-preview"
                      />
                    ) : (
                      <div className="image-placeholder">
                        <div>
                          <Upload size={40} />
                          <p>Drag & drop an image or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="section-title">Ingredients</h2>
                <div className="ingredients-container">
                  {editingRecipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-row">
                      <div className="ingredient-fields">
                        <div className="ingredient-field-wrapper">
                          <label htmlFor={`ingredient-${index}`} className="ingredient-label">Ingredient</label>
                          <input
                            type="text"
                            id={`ingredient-${index}`}
                            className="ingredient-input"
                            placeholder="e.g. Flour"
                            value={ingredient.item}
                            onChange={(e) => {
                              const newIngredients = [...editingRecipe.ingredients];
                              newIngredients[index].item = e.target.value;
                              setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                            }}
                            required
                          />
                        </div>
                        <div className="ingredient-field-wrapper">
                          <label htmlFor={`quantity-${index}`} className="ingredient-label">Quantity</label>
                          <input
                            type="text"
                            id={`quantity-${index}`}
                            className="ingredient-input"
                            placeholder="e.g. 2 cups"
                            value={ingredient.quantity}
                            onChange={(e) => {
                              const newIngredients = [...editingRecipe.ingredients];
                              newIngredients[index].quantity = e.target.value;
                              setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                            }}
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        className="ingredient-delete"
                        onClick={() => {
                          const newIngredients = editingRecipe.ingredients.filter((_, i) => i !== index);
                          setEditingRecipe({...editingRecipe, ingredients: newIngredients});
                        }}
                        disabled={editingRecipe.ingredients.length <= 1}
                        aria-label="Remove ingredient"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="add-ingredient"
                    onClick={() => {
                      setEditingRecipe({
                        ...editingRecipe,
                        ingredients: [...editingRecipe.ingredients, { item: "", quantity: "" }]
                      });
                    }}
                  >
                    <Plus size={18} /> 
                    Add Another Ingredient
                  </button>
                </div>
              </div>
              
              <div className="form-section">
                <label htmlFor="edit-instructions" className="form-label">Cooking Instructions</label>
                <textarea
                  id="edit-instructions"
                  className="form-textarea"
                  value={editingRecipe.Instruction}
                  onChange={(e) => setEditingRecipe({...editingRecipe, Instruction: e.target.value})}
                  placeholder="Step by step cooking instructions"
                  required
                />
              </div>
            </div>
            
            <div className="profile-edit-modal-footer">
              <button 
                type="button" 
                className="profile-btn secondary-btn"
                onClick={() => {
                  setIsEditing(false);
                  setEditingRecipe(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="profile-btn primary-btn"
                onClick={handleSubmitEdit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="loading-spinner" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Chart component for use in tab navigation
const Chart = ({ size, ...props }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

export default Profile;