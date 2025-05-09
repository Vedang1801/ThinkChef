import "./init";
/*import "../App.css";*/
import "../styles/home.css";
import "../styles/tips.css";
import "../styles/recipeCard.css";
import "../styles/profile.css";
import "../styles/main.css";
import "../styles/login.css";
import "../styles/addrecipe.css";

import React, { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { useAuth } from "./authContext";


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
  totalTime: string;  // New field for total cooking time
  servings: string;   // New field for number of servings
}

const AddRecipe: React.FC = () => {
  const [recipeData, setRecipeData] = useState<RecipeData>({
    title: '',
    description: '',
    instructions: '',
    ingredients: [{ item: '', quantity: '' }],
    image: '',
    totalTime: '',  // Initialize new fields
    servings: '',
  });

  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  // Add new state for upload loading
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!loggedIn) {
      navigate('/login');
    }
  }, [loggedIn, navigate]);

  // Handle basic input changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRecipeData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle ingredient changes
  const handleIngredientChange = (
    index: number, 
    field: keyof Ingredient, 
    value: string
  ) => {
    const newIngredients = [...recipeData.ingredients];
    newIngredients[index][field] = value;
    setRecipeData(prevState => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  // Remove an ingredient
  const handleDeleteIngredient = (index: number) => {
    const newIngredients = recipeData.ingredients.filter((_, i) => i !== index);
    setRecipeData(prevState => ({
      ...prevState,
      ingredients: newIngredients,
    }));
  };

  // Add more ingredient fields
  const handleAddMoreIngredients = () => {
    setRecipeData(prevState => ({
      ...prevState,
      ingredients: [...prevState.ingredients, { item: '', quantity: '' }],
    }));
  };

  // Handle image file change
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecipeData(prevState => ({
        ...prevState,
        image: file,
      }));
    }
  };

  // Upload image
  const handleAddImageClick = async () => {
    try {
      if (!recipeData.image) {
        toast.error('Please select an image');
        return;
      }

      setIsUploading(true); // Start loading
      const formData = new FormData();
      formData.append('image', recipeData.image);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        toast.success('Image uploaded successfully');
        setRecipeData(prevState => ({
          ...prevState,
          image: responseData.imageUrl,
        }));
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false); // End loading
    }
  };

  // Clear image
  const handleClearImage = () => {
    setRecipeData(prevState => ({
      ...prevState,
      image: '',
    }));
    // Reset the file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  // Submit recipe
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!loggedIn) {
      navigate('/login');
      return;
    }

    // Check for required fields
    if (!recipeData.image) {
      toast.error('Please upload an image');
      return;
    }

    const requiredFieldsMissing = 
      !recipeData.title || 
      !recipeData.description || 
      !recipeData.instructions ||
      !recipeData.totalTime ||  // Validate time and servings
      !recipeData.servings ||
      recipeData.ingredients.some(ing => !ing.item || !ing.quantity);

    if (requiredFieldsMissing) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      // Prepare request data
      const requestData = {
        title: recipeData.title,
        description: recipeData.description,
        user_id: Cookies.get('user_id'),
        image: recipeData.image,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients,
        totalTime: recipeData.totalTime,  // Include in request
        servings: recipeData.servings,    // Include in request
      };

      // Send recipe creation request
      const response = await fetch('/api/recipes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success('Recipe created successfully');
        navigate('/');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error creating recipe');
      }
    } catch (error) {
      console.error('Recipe submission error:', error);
      toast.error('Failed to create recipe');
    }
  };

  return (
    <div className="recipe-add-container">
      <div className="recipe-add-wrapper">
        <form onSubmit={handleSubmit} className="recipe-form">
          <h2 className="recipe-form-title">Create New Recipe</h2>
          
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">Recipe Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-input"
              value={recipeData.title}
              onChange={handleChange}
              placeholder="Enter recipe title"
              required
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={recipeData.description}
              onChange={handleChange}
              placeholder="Describe your recipe"
              required
            />
          </div>

          {/* New fields for Total Time and Servings */}
          <div className="form-group recipe-info-row">
            <div className="recipe-info-field">
              <label htmlFor="totalTime" className="form-label">Total Time</label>
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
            <div className="recipe-info-field">
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

          {/* Instructions Input */}
          <div className="form-group">
            <label htmlFor="instructions" className="form-label">Cooking Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              className="form-textarea"
              value={recipeData.instructions}
              onChange={handleChange}
              placeholder="Step-by-step cooking instructions"
              required
            />
          </div>

          {/* Ingredients Section */}
          <div className="form-group">
            <label className="form-label">Ingredients</label>
            {recipeData.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-input-group">
                <input
                  type="text"
                  className="ingredient-input"
                  placeholder="Ingredient"
                  value={ingredient.item}
                  onChange={(e) => handleIngredientChange(index, 'item', e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="ingredient-input"
                  placeholder="Quantity"
                  value={ingredient.quantity}
                  onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="ingredient-delete-btn"
                  onClick={() => handleDeleteIngredient(index)}
                  aria-label="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="add-ingredient-btn"
              onClick={handleAddMoreIngredients}
            >
              + Add Ingredient
            </button>
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="image" className="form-label">Recipe Image</label>
            <div className="image-upload-container">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                className="image-input"
                onChange={handleImageChange}
                required
              />
              <div className="image-upload-actions">
                <button
                  type="button"
                  className="image-upload-btn"
                  onClick={handleAddImageClick}
                  disabled={isUploading || !recipeData.image || typeof recipeData.image === 'string'}
                >
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <button
                  type="button"
                  className="clear-image-btn"
                  onClick={handleClearImage}
                  disabled={!recipeData.image || typeof recipeData.image === 'string'}
                >
                  Clear
                </button>
              </div>
            </div>
            {recipeData.image && typeof recipeData.image !== 'string' && (
              <p className="image-filename">
                {recipeData.image.name}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-recipe-btn">
            Create Recipe
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddRecipe;