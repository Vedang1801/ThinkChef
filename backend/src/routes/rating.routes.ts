import { Router } from 'express';
import * as ratingController from '../controllers/rating.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// POST /api/recipes/:id/ratings/create - Create a rating
router.post('/:id/ratings/create', authenticateToken, ratingController.createRating);

// GET /api/recipes/:id/ratings - Get average rating
router.get('/:id/ratings', ratingController.getAverageRating);

// GET /api/recipes/:id/ratings/user - Get user's rating
router.get('/:id/ratings/user', authenticateToken, ratingController.getUserRating);

export default router;
