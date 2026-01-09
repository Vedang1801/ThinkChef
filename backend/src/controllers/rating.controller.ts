import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express.d';
import * as ratingService from '../services/rating.service';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Create a rating for a recipe
 */
export const createRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);
        const { rating, user_id } = req.body;

        await ratingService.createRating(recipeId, user_id, rating);

        sendSuccess(res, null, 'Rating added successfully', 201);
    } catch (error: any) {
        logger.error('Create rating error:', error);
        sendError(res, error.message || 'Error adding rating', 500);
    }
};

/**
 * Get average rating for a recipe
 */
export const getAverageRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);

        const averageRating = await ratingService.getAverageRating(recipeId);

        res.status(200).json({ averageRating });
    } catch (error: any) {
        logger.error('Get average rating error:', error);
        sendError(res, error.message || 'Error retrieving rating', 500);
    }
};

/**
 * Get user's rating for a recipe
 */
export const getUserRating = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);
        const userId = req.userId!;

        const result = await ratingService.getUserRating(recipeId, userId);

        res.status(200).json(result);
    } catch (error: any) {
        logger.error('Get user rating error:', error);
        sendError(res, error.message || 'Error checking rating', 500);
    }
};
