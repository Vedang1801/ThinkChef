import { Router } from 'express';
import authRoutes from './auth.routes';
import recipeRoutes from './recipe.routes';
import ratingRoutes from './rating.routes';
import commentRoutes from './comment.routes';
import uploadRoutes from './upload.routes';
import searchRoutes from './search.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';
import * as recipeController from '../controllers/recipe.controller';

const router = Router();

// Mount all routes
router.use('/api', authRoutes);
router.use('/api', uploadRoutes);
router.use('/api/users', userRoutes);
router.use('/api/recipe', aiRoutes);

// Special route for all ingredients (must be before /api/recipes)
router.get('/api/ingredients', recipeController.getAllIngredients);

router.use('/api/recipes', recipeRoutes);
router.use('/api/recipes', ratingRoutes);
router.use('/api/recipes', commentRoutes);
router.use('/api/search', searchRoutes);

export default router;
