import "../../styles/addrecipe.css";
import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useAuth } from "../auth/authContext";
import {
  Upload, X, Image as ImageIcon, Loader2, Clock, Users,
  Plus, ChefHat,
} from "lucide-react";
import { CUISINE_OPTIONS, DIETARY_OPTIONS, MEAL_TYPE_OPTIONS, DIFFICULTY_OPTIONS, NON_VEG_KEYWORDS, DAIRY_KEYWORDS, EGG_KEYWORDS } from "../../constants/recipeOptions";

// Ingredient interface for type safety
interface Ingredient {
  item: string;
  quantity: string;
}

// Recipe data interface for form state
interface RecipeData {
  title: string;
  description: string;
  instructions: string;
  ingredients: Ingredient[];
  image: File | string;
  totalTime: string;
  servings: string;
  cuisine_type: string;
  dietary_type: string;
  meal_types: string[];
  difficulty: string;
}

// Fallback image URL for preview
const fallbackImage = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=1200&q=80";

// Capitalize the first letter of each word in the title
function capitalizeTitle(title: string) {
  return title.replace(/\b\w/g, (char) => char.toUpperCase());
}

const API_URL = import.meta.env.VITE_API_URL;

const AddRecipe: React.FC = () => {
  // State for recipe form data
  const [recipeData, setRecipeData] = useState<RecipeData>({
    title: "",
    description: "",
    instructions: "",
    ingredients: [{ item: "", quantity: "" }],
    image: "",
    totalTime: "",
    servings: "",
    cuisine_type: "",
    dietary_type: "",
    meal_types: [],
    difficulty: "medium",
  });

  const { loggedIn } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  // Redirect to login if not logged in
  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
    }
  }, [loggedIn, navigate]);

  // Handle input changes for text fields
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRecipeData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle changes to individual ingredient fields
  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...recipeData.ingredients];
    newIngredients[index][field] = value;
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  // Remove an ingredient row
  const handleDeleteIngredient = (index: number) => {
    const newIngredients = recipeData.ingredients.filter((_, i) => i !== index);
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };
  // Handle meal type checkbox changes
  const handleMealTypeChange = (mealType: string) => {
    setRecipeData((prevState) => {
      const currentMealTypes = prevState.meal_types;
      const newMealTypes = currentMealTypes.includes(mealType)
        ? currentMealTypes.filter(type => type !== mealType)
        : [...currentMealTypes, mealType];
      return {
        ...prevState,
        meal_types: newMealTypes,
      };
    });
  };

  // Add a new empty ingredient row
  const handleAddMoreIngredients = () => {
    setRecipeData((prevState) => ({
      ...prevState,
      ingredients: [...prevState.ingredients, { item: "", quantity: "" }],
    }));
  };

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipeData((prevState) => ({
        ...prevState,
        image: file,
      }));
    }
  };

  // Handle drag-and-drop image upload
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

  // Upload image to S3 via backend
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

  // Clear the selected image
  const handleClearImage = () => {
    setRecipeData((prevState) => ({
      ...prevState,
      image: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit the recipe form
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

    // Level 1 Defense: The "Nudge"
    // Check for conflicting ingredients based on dietary type
    if (recipeData.dietary_type === 'vegan' || recipeData.dietary_type === 'vegetarian') {
      const allIngredients = recipeData.ingredients.map(ing => ing.item.toLowerCase()).join(' ');

      // Check for meat in vegetarian/vegan recipes
      const foundMeat = NON_VEG_KEYWORDS.find(keyword => allIngredients.includes(keyword));

      // Check for dairy and eggs in vegan recipes
      let foundDairy, foundEgg;
      if (recipeData.dietary_type === 'vegan') {
        foundDairy = DAIRY_KEYWORDS.find(keyword => allIngredients.includes(keyword));
        foundEgg = EGG_KEYWORDS.find(keyword => allIngredients.includes(keyword));
      }

      const conflicts = [];
      if (foundMeat) conflicts.push(`meat/fish (${foundMeat})`);
      if (foundDairy) conflicts.push(`dairy (${foundDairy})`);
      if (foundEgg) conflicts.push(`eggs (${foundEgg})`);

      if (conflicts.length > 0) {
        const dietaryLabel = DIETARY_OPTIONS.find(d => d.value === recipeData.dietary_type)?.label;
        const conflictList = conflicts.join(', ');

        const confirmSubmit = window.confirm(
          `⚠️ Dietary Conflict Detected\n\nYou selected "${dietaryLabel}" but your ingredients include: ${conflictList}.\n\nAre you sure you want to proceed?\n\n(Note: The system may auto-correct this based on ingredients)`
        );
        if (!confirmSubmit) {
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      const requestData = {
        title: capitalizeTitle(recipeData.title),
        description: recipeData.description,
        user_id: Cookies.get("user_id"),
        image: recipeData.image,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients,
        totalTime: recipeData.totalTime,
        servings: recipeData.servings,
        cuisine_type: recipeData.cuisine_type || null,
        dietary_type: recipeData.dietary_type || null,
        meal_types: recipeData.meal_types.length > 0 ? recipeData.meal_types : null,
        difficulty: recipeData.difficulty || null,
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

  // Bulk add ingredients from textarea input
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

  // Live preview image for sidebar
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
            {/* Title input */}
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

            {/* Description input */}
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

            {/* Image upload section */}
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
                  {/* Image preview logic handled below */}
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

            {/* Cooking time and servings */}
            <div className="form-section">
              <div className="form-row">
                <div className="form-group">
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

                <div className="form-group">
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

            {/* Recipe Tags Section */}
            <div className="form-section recipe-categories-section">
              <h2 className="section-title">Recipe Categories</h2>
              <p className="section-description">Help others discover your recipe</p>

              <div className="categories-grid">
                {/* Cuisine and Difficulty Row */}
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cuisine_type" className="form-label">Cuisine Type</label>
                    <div className="select-wrapper">
                      <select
                        id="cuisine_type"
                        name="cuisine_type"
                        className="form-select"
                        value={recipeData.cuisine_type}
                        onChange={handleChange}
                      >
                        <option value="" disabled>Select Cuisine (Optional)</option>
                        {CUISINE_OPTIONS.filter(opt => opt.value).map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="difficulty" className="form-label">Difficulty Level</label>
                    <div className="select-wrapper">
                      <select
                        id="difficulty"
                        name="difficulty"
                        className="form-select"
                        value={recipeData.difficulty}
                        onChange={handleChange}
                      >
                        {DIFFICULTY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dietary Type Radio Buttons */}
                <div className="category-group">
                  <label className="form-label">Dietary Type</label>
                  <p className="field-hint">
                    Auto-detected from ingredients, but you can override
                  </p>
                  <div className="options-grid">
                    {DIETARY_OPTIONS.map(option => (
                      <label key={option.value} className={`option-card ${recipeData.dietary_type === option.value ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="dietary_type"
                          value={option.value}
                          checked={recipeData.dietary_type === option.value}
                          onChange={handleChange}
                          className="hidden-input"
                        />
                        <span className="option-label">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Meal Types Checkboxes */}
                <div className="category-group">
                  <label className="form-label">Meal Type</label>
                  <p className="field-hint">
                    Select all that apply
                  </p>
                  <div className="options-grid">
                    {MEAL_TYPE_OPTIONS.map(option => (
                      <label key={option.value} className={`option-card ${recipeData.meal_types.includes(option.value) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          value={option.value}
                          checked={recipeData.meal_types.includes(option.value)}
                          onChange={() => handleMealTypeChange(option.value)}
                          className="hidden-input"
                        />
                        <span className="option-label">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients section */}
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
                      placeholder={[
                        "Paste or type multiple ingredients below.",
                        "Format: Ingredient, Quantity (comma separated)",
                        "One ingredient per line.",
                        "Example:",
                        "Paneer (cubed), 250 grams",
                        "Butter, 3 tablespoons",
                        "Tomatoes (chopped), 4 medium"
                      ].join('\n')}
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

            {/* Cooking instructions */}
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

            {/* Submit button */}
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