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
import { 
  UserIcon, 
  MailIcon, 
  TrashIcon, 
  RefreshCwIcon, 
  XIcon,
  EditIcon
} from "lucide-react";


interface Post {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  user_id: number;
  image: string;
  created_at: Date;
  ingredients: string[];
}

interface EditingRecipe {
  recipe_id: number;
  title: string;
  description: string;
  Instruction: string;
  ingredients: { item: string; quantity: string; }[];
  image: string | File;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<EditingRecipe | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      const postsData = await Promise.all(response.data.map(async (post: any) => {
        const ingredientsResponse = await axios.get(`/api/recipes/${post.recipe_id}/ingredients`);
        const ingredientsData = ingredientsResponse.data.map((ingredient: any) => 
          `${ingredient.item}: ${ingredient.quantity}`
        );
        return { ...post, ingredients: ingredientsData };
      }));
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setPosts([]);
    }
  };
  
  const handleDelete = (event, postId: number) => {
    event.stopPropagation();
    setPendingDelete(postId);
    setCountdown(5);
    toast.info("Recipe will be deleted in 5 seconds", {
      position: "top-right",
      autoClose: 5000
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
    }, 5000);
    setUndoTimeout(timeout);
  };

  const handlePermanentDelete = async (postId: number) => {
    try {
      await axios.delete(`/api/recipes/delete/${postId}`);
      setPosts(posts.filter((post) => post.recipe_id !== postId));
      toast.success("Recipe permanently deleted", {
        position: "top-right"
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Error deleting recipe", {
        position: "top-right"
      });
    }
    setPendingDelete(null);
  };

  const handleUndo = (event) => {
    event.stopPropagation();
    if (pendingDelete !== null) {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        setUndoTimeout(null);
      }
      setPendingDelete(null);
      toast.success("Recipe deletion cancelled", {
        position: "top-right"
      });
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

  const handleEdit = (event: React.MouseEvent, post: Post) => {
    event.stopPropagation();
    console.log("Original ingredients:", post.ingredients);
    
    const parsedIngredients = post.ingredients.map(ing => {
      const colonIndex = ing.indexOf(':');
      if (colonIndex !== -1) {
        const item = ing.substring(0, colonIndex).trim();
        const quantity = ing.substring(colonIndex + 1).trim();
        console.log(`Parsed - Item: ${item}, Quantity: ${quantity}`);
        return { item, quantity };
      }
      return { item: ing.trim(), quantity: '' };
    });

    console.log("Parsed ingredients:", parsedIngredients);
    
    setEditingRecipe({
      recipe_id: post.recipe_id,
      title: post.title,
      description: post.description,
      Instruction: post.Instruction,
      ingredients: parsedIngredients,
      image: post.image
    });
    setIsEditing(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingRecipe) return;

    try {
      const formattedIngredients = editingRecipe.ingredients.map(ing => ({
        item: ing.item,
        quantity: ing.quantity
      }));

      const updateData = {
        title: editingRecipe.title,
        description: editingRecipe.description,
        instruction: editingRecipe.Instruction,
        ingredients: formattedIngredients,
        image: editingRecipe.image,
      };

      console.log('Sending update data:', updateData);

      const response = await axios.put(
        `/api/recipes/update/${editingRecipe.recipe_id}`,
        updateData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        }
      );

      if (response.status === 200) {
        toast.success("Recipe updated successfully");
        fetchPosts();
        setIsEditing(false);
        setEditingRecipe(null);
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      if (axios.isAxiosError(error)) {
        console.log("Error response:", error.response);
        console.log("Error request:", error.request);
        console.log("Error config:", error.config);
        
        const errorMessage = error.response?.data?.message || "Failed to update recipe";
        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload-image', formData);
      if (response.data.imageUrl) {
        setEditingRecipe(prev => prev ? {
          ...prev,
          image: response.data.imageUrl
        } : null);
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto overflow-hidden pt-16">
        {/* Profile Header */}
        <div className="bg-gray-800 shadow-lg rounded-xl p-6 mb-8 mt-4">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-12 h-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {Cookies.get("username")}
              </h1>
              <div className="flex items-center space-x-3 text-gray-400 mt-2">
                <MailIcon className="w-5 h-5" />
                <span>{Cookies.get("email")}</span>
              </div>
            </div>
          </div>
        </div>

        {isEditing && editingRecipe ? (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4">
              <div className="mb-4 border-b border-gray-200">
                <div className="flex justify-between items-center pb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Edit Recipe</h2>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditingRecipe(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingRecipe.title}
                    onChange={(e) => setEditingRecipe(prev => prev ? {...prev, title: e.target.value} : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={editingRecipe.description}
                    onChange={(e) => setEditingRecipe(prev => prev ? {...prev, description: e.target.value} : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                  <textarea
                    value={editingRecipe.Instruction}
                    onChange={(e) => setEditingRecipe(prev => prev ? {...prev, Instruction: e.target.value} : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                  <div className="space-y-3">
                    {editingRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Ingredient"
                          value={ingredient.item}
                          onChange={(e) => {
                            const newIngredients = [...editingRecipe.ingredients];
                            newIngredients[index] = { ...newIngredients[index], item: e.target.value };
                            setEditingRecipe(prev => prev ? {...prev, ingredients: newIngredients} : null);
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Quantity"
                          value={ingredient.quantity}
                          onChange={(e) => {
                            const newIngredients = [...editingRecipe.ingredients];
                            newIngredients[index] = { ...newIngredients[index], quantity: e.target.value };
                            setEditingRecipe(prev => prev ? {...prev, ingredients: newIngredients} : null);
                          }}
                          className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newIngredients = editingRecipe.ingredients.filter((_, i) => i !== index);
                            setEditingRecipe(prev => prev ? {...prev, ingredients: newIngredients} : null);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <XIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingRecipe(prev => prev ? {
                      ...prev,
                      ingredients: [...prev.ingredients, { item: '', quantity: '' }]
                    } : null)}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    + Add Ingredient
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Image</label>
                  <div className="mt-1 flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                      <img 
                        src={typeof editingRecipe.image === 'string' ? editingRecipe.image : URL.createObjectURL(editingRecipe.image)} 
                        alt="Recipe" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                        className="hidden"
                        id="recipe-image"
                      />
                      <label
                        htmlFor="recipe-image"
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 cursor-pointer disabled:bg-gray-400"
                      >
                        {isUploading ? 'Uploading...' : 'Change Image'}
                      </label>
                      {typeof editingRecipe.image === 'string' && (
                        <button
                          type="button"
                          onClick={() => setEditingRecipe(prev => prev ? {...prev, image: ''} : null)}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingRecipe(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Recipes Grid or Empty State */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div 
                key={post.recipe_id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105 hover:shadow-xl"
                onClick={() => handleRecipeClick(post)}
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 relative">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={(event) => handleEdit(event, post)}
                      className="flex-1 bg-indigo-500 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-600 transition"
                    >
                      <EditIcon className="w-4 h-4" />
                      <span className="inline-block">Edit</span>
                    </button>
                    {pendingDelete === post.recipe_id ? (
                      <button 
                        onClick={(event) => handleUndo(event)} 
                        className="w-full bg-green-500 text-white py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-600 transition"
                      >
                        <RefreshCwIcon className="w-5 h-5" />
                        <span>Undo ({countdown})</span>
                      </button>
                    ) : (
                      <button
                        onClick={(event) => handleDelete(event, post.recipe_id)}
                        className="w-full bg-red-500 text-white py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-red-600 transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                        <span>Delete Recipe</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg">
            <div className="max-w-md mx-auto">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                You haven't uploaded any recipes yet
              </h3>
              <p className="text-gray-600 mb-8">
                Share your culinary creations with the world by adding your first recipe!
              </p>
              <button
                onClick={() => navigate('/addrecipes')}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                <span className="mr-2">Create Your First Recipe</span>
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 4v16m8-8H4" 
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {isRecipeWidgetOpen && selectedRecipe && (
        <div className="recipe-modal-container">
          <div className="recipe-modal-content">
            <button 
              onClick={handleCloseWidget} 
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition z-10"
            >
              <XIcon className="w-8 h-8" />
            </button>
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
                author: Cookies.get("username"),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;