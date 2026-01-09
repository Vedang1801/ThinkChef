import { Request, Response } from 'express';
import * as commentService from '../services/comment.service';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Get comments for a recipe
 */
export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);

        const comments = await commentService.getCommentsByRecipeId(recipeId);

        res.status(200).json(comments);
    } catch (error: any) {
        logger.error('Get comments error:', error);
        sendError(res, error.message || 'Error retrieving comments', 500);
    }
};

/**
 * Create a comment for a recipe
 */
export const createComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);
        const { comment_text, user_id, username } = req.body;

        await commentService.createComment(recipeId, user_id, username, comment_text);

        sendSuccess(res, null, 'Comment added successfully', 201);
    } catch (error: any) {
        logger.error('Create comment error:', error);
        sendError(res, error.message || 'Error adding comment', 500);
    }
};
