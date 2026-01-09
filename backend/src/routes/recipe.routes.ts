import { Router } from 'express';
import * as recipeController from '../controllers/recipe.controller';
import { validateRecipeCreation } from '../middleware/validation.middleware';

const router = Router();

// GET /api/recipes/filter - Filter recipes by tags
router.get('/filter', recipeController.filterRecipes);

// GET /api/recipes - Get all recipes with pagination and search
router.get('/', recipeController.getAllRecipes);

// GET /api/recipes/sort/:type - Get sorted recipes
router.get('/sort/:type', recipeController.getSortedRecipes);

// GET /api/recipes/:id - Get recipes by user ID
router.get('/:id', recipeController.getRecipesByUserId);

// GET /api/recipes/:id/ingredients - Get ingredients for a recipe
router.get('/:id/ingredients', recipeController.getIngredients);

// POST /api/recipes/create - Create a new recipe
router.post('/create', validateRecipeCreation, recipeController.createRecipe);

// PUT /api/recipes/update/:id - Update a recipe
router.put('/update/:id', recipeController.updateRecipe);

// DELETE /api/recipes/delete/:id - Delete a recipe
router.delete('/delete/:id', recipeController.deleteRecipe);

export default router;
