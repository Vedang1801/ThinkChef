import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';

const router = Router();

// GET /api/recipes/:id/comments - Get comments for a recipe
router.get('/:id/comments', commentController.getComments);

// POST /api/recipes/:id/comments/create - Create a comment
router.post('/:id/comments/create', commentController.createComment);

export default router;
