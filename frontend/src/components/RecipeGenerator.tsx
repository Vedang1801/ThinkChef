import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChefHat, Loader2 } from 'lucide-react';
import '../styles/recipeGenerator.css';

interface Recipe {
  title: string;
  ingredients: string[];
  method: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const RecipeGenerator: React.FC = () => {
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  const handleGenerateRecipe = async () => {
    // Parse ingredients from comma-separated input
    const ingredients = ingredientsInput
      .split(',')
      .map(ingredient => ingredient.trim().toLowerCase())
      .filter(ingredient => ingredient.length > 0);

    if (ingredients.length < 2) {
      toast.warning('Please enter at least 2 ingredients separated by commas');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/recipe/generate`, { ingredients });
      console.log('Recipe generated:', response.data);
      
      // Process the recipe to format instructions properly
      const recipe = response.data.recipe;
      if (recipe.method) {
        // Split by numbers followed by period or by sentences, then clean up
        recipe.method = recipe.method
          .replace(/(\d+\.\s*)/g, '\n$1') // Add newline before numbered steps
          .replace(/^\n/, '') // Remove leading newline
          .trim();
      }
      
      setGeneratedRecipe(recipe);
      toast.success('Recipe generated successfully!');
    } catch (error) {
      console.error('Failed to generate recipe:', error);
      toast.error('Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async () => {
    // Logic to save the recipe to the user's account can be added here
    toast.success('Recipe saved!');
  };

  return (
    <div className="recipe-generator-container">
      <section className="generator-header">
        <h1>AI Recipe Generator</h1>
        <p>
          Enter ingredients you have on hand, and our AI will generate a delicious recipe for you.
          Perfect for using up what's in your fridge!
        </p>
      </section>

      <div className="generator-main">
        <div className="ingredients-input-container">
          <h2>Your Ingredients</h2>
          <div className="ingredients-input-section">
            <textarea
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              placeholder="Enter ingredients separated by commas (e.g. chicken, rice, tomatoes, onions, garlic)"
              disabled={loading}
              className="ingredients-textarea"
              rows={4}
            />
            <p className="input-hint">
              💡 Tip: Separate each ingredient with a comma. Example: "chicken breast, rice, bell peppers, soy sauce"
            </p>
          </div>

          <button 
            className="generate-button" 
            onClick={handleGenerateRecipe} 
            disabled={loading || ingredientsInput.trim().length === 0}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generating Recipe...
              </>
            ) : (
              <>
                <ChefHat size={20} />
                Generate Recipe
              </>
            )}
          </button>
        </div>

        {generatedRecipe && (
          <div className="generated-recipe">
            <h2>{generatedRecipe.title}</h2>
            
            <h3>Ingredients</h3>
            <ul>
              {generatedRecipe.ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
            
            <h3>Instructions</h3>
            <div className="recipe-method">
              {generatedRecipe.method.split('\n').map((step, index) => (
                <p key={index}>{step}</p>
              ))}
            </div>
            
            <div className="recipe-actions">
              <button className="save-recipe-btn" onClick={saveRecipe}>
                Save Recipe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeGenerator;
