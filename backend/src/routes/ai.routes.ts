import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// POST /api/recipe/generate - Generate a recipe using AI (with strict rate limiting)
router.post('/generate', aiLimiter, aiController.generateRecipe);

export default router;
