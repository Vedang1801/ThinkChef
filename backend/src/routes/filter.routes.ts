import { Router } from 'express';
import * as recipeController from '../controllers/recipe.controller';

const router = Router();

/**
 * GET /api/recipes/filter
 * Filter recipes by cuisine, dietary type, meal type, or difficulty
 * Query params: cuisine, dietary, meal, difficulty, page, limit
 */
router.get('/filter', recipeController.filterRecipes);

export default router;
