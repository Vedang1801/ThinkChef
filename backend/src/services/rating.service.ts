import * as ratingModel from '../models/rating.model';

/**
 * Create a rating for a recipe
 */
export const createRating = async (
    recipeId: number,
    userId: string,
    stars: number
): Promise<void> => {
    if (stars < 1 || stars > 5) {
        throw new Error('Rating must be between 1 and 5');
    }

    return ratingModel.createRating(recipeId, userId, stars);
};

/**
 * Get average rating for a recipe
 */
export const getAverageRating = async (recipeId: number): Promise<number> => {
    return ratingModel.getAverageRating(recipeId);
};

/**
 * Check if user has rated a recipe
 */
export const getUserRating = async (recipeId: number, userId: string) => {
    return ratingModel.getUserRating(recipeId, userId);
};
