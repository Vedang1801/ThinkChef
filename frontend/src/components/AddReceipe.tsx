import "./init";
import "../styles/addrecipe.css";
import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useAuth } from "./authContext";
import { 
  Upload, X, Image as ImageIcon, Loader2, Clock, Users, 
  Plus, ChefHat,  
} from "lucide-react";

// Ingredient interface for type safety
interface Ingredient {
  item: string;
  quantity: string;
}

// Recipe data interface
interface RecipeData {
  title: string;
  description: string;
  instructions: string;
  ingredients: Ingredient[];
  image: File | string;
  totalTime: string;
  servings: string;
}

const fallbackImage = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80";

// Utility to capitalize the first letter of each word in the title
function capitalizeTitle(title: string) {
  return title.replace(/\b\w/g, (char) => char.toUpperCase());
}

const API_URL = import.meta.env.VITE_API_URL;

const AddRecipe: React.FC = () => {
  const [recipeData, setRecipeData] = useState<RecipeData>({
    title: "",
    description: "",
    instructions: "",
    ingredients: [{ item: "", quantity: "" }],
    image: "",
    totalTime: "",
    servings: "",
  });

  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
    }
  }, [loggedIn, navigate]);

  // Handle input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecipeData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Ingredient management - updated to handle separate fields
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...recipeData.ingredients];
    newIngredients[index][field] = value;
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  const handleDeleteIngredient = (index: number) => {
    const newIngredients = recipeData.ingredients.filter((_, i) => i !== index);
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  const handleAddMoreIngredients = () => {
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: [...prevState.ingredients, { item: "", quantity: "" }],
    }));
  };

  // Drag-and-drop image upload
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipeData((prevState) => ({
        ...prevState,
        image: file,
      }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setRecipeData((prevState) => ({
        ...prevState,
        image: e.dataTransfer.files[0],
      }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  // Upload image to S3
  const handleAddImageClick = async () => {
    try {
      if (!recipeData.image || typeof recipeData.image === "string") {
        toast.error("Please select an image");
        return;
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", recipeData.image as File);

      const response = await fetch(`${API_URL}/api/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        toast.success("Image uploaded successfully");
        setRecipeData((prevState) => ({
          ...prevState,
          image: responseData.imageUrl,
        }));
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  // Clear image
  const handleClearImage = () => {
    setRecipeData((prevState) => ({
      ...prevState,
      image: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit recipe
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    
    if (!recipeData.image || typeof recipeData.image !== "string") {
      toast.error("Please upload an image");
      return;
    }
    
    const requiredFieldsMissing =
      !recipeData.title ||
      !recipeData.description ||
      !recipeData.instructions ||
      !recipeData.totalTime ||
      !recipeData.servings ||
      recipeData.ingredients.some((ing) => !ing.item);
    
    if (requiredFieldsMissing) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const requestData = {
        // Capitalize the title before sending
        title: capitalizeTitle(recipeData.title),
        description: recipeData.description,
        user_id: Cookies.get("user_id"),
        image: recipeData.image,
        // Ensure this matches database column name 'instruction' (singular)
        instructions: recipeData.instructions, 
        ingredients: recipeData.ingredients,
        totalTime: recipeData.totalTime,
        servings: recipeData.servings,
      };

      const response = await fetch(`${API_URL}/api/recipes/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success("Recipe created successfully");
        navigate("/");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Error creating recipe");
      }
    } catch (error) {
      console.error("Recipe submission error:", error);
      toast.error("Failed to create recipe");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk add handler
  const handleBulkAddIngredients = () => {
    // Split by newlines, trim, and filter out empty lines
    const lines = bulkInput
      .split(/\n|\r/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
    if (lines.length === 0) {
      toast.warning("No valid ingredients found");
      return;
    }
    // For each line, split on the first comma
    const parsed = lines.map(line => {
      const [item, ...rest] = line.split(",");
      return {
        item: item.trim(),
        quantity: rest.join(",").trim() // join in case quantity has commas
      };
    });
    // Remove all empty ingredient rows before adding new ones
    setRecipeData(prev => ({
      ...prev,
      ingredients: [
        ...prev.ingredients.filter(ing => ing.item.trim() || ing.quantity.trim()),
        ...parsed
      ]
    }));
    setBulkInput("");
    setShowBulkInput(false);
    toast.success(`${parsed.length} ingredients added!`);
  };

  // Live preview for sidebar
  const previewImage =
    typeof recipeData.image === "string" && recipeData.image
      ? recipeData.image
      : typeof recipeData.image === "object" && recipeData.image
      ? URL.createObjectURL(recipeData.image)
      : fallbackImage;

  return (
    <div className="recipe-form-container">
      <div className="recipe-form-wrapper">
        {/* Main Form */}
        <main className="recipe-form-main">
          <h1 className="recipe-form-title">Create a New Recipe</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <label htmlFor="title" className="form-label">Recipe Title</label>
              <input
                type="text"
                id="title"
                name="title"
                className="form-input"
                value={recipeData.title}
                onChange={handleChange}
                placeholder="What's your dish called?"
                required
              />
            </div>
            
            <div className="form-section">
              <label htmlFor="description" className="form-label">Description</label>
              <p className="section-description">Write a brief introduction to your recipe</p>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                value={recipeData.description}
                onChange={handleChange}
                placeholder="Tell us the story behind this recipe or what makes it special..."
                required
              />
            </div>
            
            <div className="form-section">
              <h2 className="section-title">Recipe Image</h2>
              <p className="section-description">Upload a high-quality photo of your finished dish</p>
              
              <div className="image-upload-container">
                <div
                  className={`image-dropzone${dragActive ? " drag-active" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                  
                  {typeof recipeData.image === "string" && recipeData.image ? (
                    <img
                      src={recipeData.image}
                      alt="Recipe Preview"
                      className="image-preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = fallbackImage;
                      }}
                    />
                  ) : typeof recipeData.image === "object" && recipeData.image ? (
                    <img
                      src={URL.createObjectURL(recipeData.image)}
                      alt="Recipe Preview"
                      className="image-preview"
                    />
                  ) : (
                    <div className="image-placeholder">
                      <ImageIcon size={40} />
                      <p>Drag and drop an image here, or click to select a file</p>
                    </div>
                  )}
                </div>
                
                <div className="image-controls">
                  <button
                    type="button"
                    className="image-button upload-button"
                    onClick={handleAddImageClick}
                    disabled={isUploading || !recipeData.image || typeof recipeData.image === "string"}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="loading-spinner" size={18} />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Upload Image
                      </>
                    )}
                  </button>
                  
                  {recipeData.image && (
                    <button
                      type="button"
                      className="image-button clear-button"
                      onClick={handleClearImage}
                      disabled={isUploading}
                    >
                      <X size={18} />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="form-row">
                <div>
                  <label htmlFor="totalTime" className="form-label">Cooking Time</label>
                  <input
                    type="text"
                    id="totalTime"
                    name="totalTime"
                    className="form-input"
                    value={recipeData.totalTime}
                    onChange={handleChange}
                    placeholder="e.g. 45 minutes"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="servings" className="form-label">Servings</label>
                  <input
                    type="text"
                    id="servings"
                    name="servings"
                    className="form-input"
                    value={recipeData.servings}
                    onChange={handleChange}
                    placeholder="e.g. 4"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2 className="section-title">Ingredients</h2>
              <p className="section-description">List all ingredients with their quantities</p>
              
              <div className="ingredients-container">
                {recipeData.ingredients.map((ingredient, index) => (
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
                          onChange={(e) => handleIngredientChange(index, "item", e.target.value)}
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
                          onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      className="ingredient-delete"
                      onClick={() => handleDeleteIngredient(index)}
                      disabled={recipeData.ingredients.length <= 1}
                      aria-label="Remove ingredient"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-ingredient"
                  onClick={handleAddMoreIngredients}
                >
                  <Plus size={18} /> 
                  Add Another Ingredient
                </button>
                <button
                  type="button"
                  className="add-ingredient"
                  style={{ marginTop: 8 }}
                  onClick={() => setShowBulkInput(v => !v)}
                >
                  <Plus size={18} />
                  Add Multiple Ingredients
                </button>
                {showBulkInput && (
                  <div className="bulk-ingredient-input">
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder={
                        [
                          "Paste or type multiple ingredients below.",
                          "Format: Ingredient, Quantity (comma separated)",
                          "One ingredient per line.",
                          "Example:",
                          "Paneer (cubed), 250 grams",
                          "Butter, 3 tablespoons",
                          "Tomatoes (chopped), 4 medium"
                        ].join('\n')
                      }
                      value={bulkInput}
                      onChange={e => setBulkInput(e.target.value)}
                      style={{ marginTop: 8, marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="add-ingredient"
                        onClick={handleBulkAddIngredients}
                      >
                        Add All
                      </button>
                      <button
                        type="button"
                        className="add-ingredient"
                        onClick={() => setShowBulkInput(false)}
                        style={{ background: '#eee', color: '#333' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-section">
              <label htmlFor="instructions" className="form-label">Cooking Instructions</label>
              <p className="section-description">Provide detailed step-by-step cooking directions</p>
              <textarea
                id="instructions"
                name="instructions"
                className="form-textarea"
                value={recipeData.instructions}
                onChange={handleChange}
                placeholder="Step 1: Preheat the oven to 350°F (175°C)..."
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="loading-spinner" size={20} />
                  Creating Recipe...
                </>
              ) : (
                <>
                  <ChefHat size={20} />
                  Create Recipe
                </>
              )}
            </button>
          </form>
        </main>
        
        {/* Preview Sidebar */}
        <aside className="recipe-preview-sidebar">
          <div className="preview-container">
            <div className="preview-header">Recipe Preview</div>
            <div className="preview-content">
              <img
                src={previewImage}
                alt="Recipe Preview"
                className="preview-image"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = fallbackImage;
                }}
              />
              
              <h2 className="preview-title">
                {recipeData.title || "Your Recipe Title"}
              </h2>
              
              <p className="preview-description">
                {recipeData.description || "Your recipe description will appear here. Add a brief introduction to tell readers about your dish."}
              </p>
              
              <div className="preview-meta">
                {recipeData.totalTime && (
                  <span><Clock size={16} /> {recipeData.totalTime}</span>
                )}
                
                {recipeData.servings && (
                  <span><Users size={16} /> {recipeData.servings} servings</span>
                )}
              </div>
              
              <div className="preview-ingredients">
                <h4>Ingredients</h4>
                <ul>
                  {recipeData.ingredients.map((ing, idx) =>
                    ing.item ? (
                      <li key={idx}>
                        {ing.item}
                        {ing.quantity ? `: ${ing.quantity}` : ""}
                      </li>
                    ) : null
                  )}
                </ul>
                
                {recipeData.ingredients.length === 0 && (
                  <p className="no-ingredients">No ingredients added yet</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddRecipe;