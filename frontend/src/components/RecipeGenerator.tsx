import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChefHat, Loader2, Plus, X } from 'lucide-react';
import '../styles/recipeGenerator.css';

interface Recipe {
  title: string;
  ingredients: string[];
  method: string;
}

const RecipeGenerator: React.FC = () => {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);

  const handleAddIngredient = () => {
    if (inputValue.trim() !== '' && !ingredients.includes(inputValue.trim().toLowerCase())) {
      setIngredients([...ingredients, inputValue.trim().toLowerCase()]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const handleGenerateRecipe = async () => {
    if (ingredients.length < 2) {
      toast.warning('Please add at least 2 ingredients');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/recipe/generate', { ingredients });
      console.log('Recipe generated:', response.data);
      setGeneratedRecipe(response.data.recipe);
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
          <div className="input-with-button">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add an ingredient (e.g. chicken, rice, tomatoes)"
              disabled={loading}
            />
            <button 
              onClick={handleAddIngredient} 
              disabled={loading || inputValue.trim() === ''}
              className="add-ingredient-btn"
            >
              <Plus size={18} />
              Add
            </button>
          </div>

          <div className="ingredients-list">
            {ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-tag">
                {ingredient}
                <button onClick={() => handleRemoveIngredient(index)} disabled={loading}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button 
            className="generate-button" 
            onClick={handleGenerateRecipe} 
            disabled={loading || ingredients.length < 2}
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
