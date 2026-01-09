import { Request, Response } from 'express';
import * as recipeService from '../services/recipe.service';
import { sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Search recipes for suggestions
 */
export const searchSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const searchTerm = String(req.query.term || '').trim();

        if (!searchTerm) {
            res.status(200).json([]);
            return;
        }

        logger.debug('Backend searching for:', searchTerm);

        const results = await recipeService.searchRecipeSuggestions(searchTerm);

        logger.debug('Search results:', results);

        res.status(200).json(results);
    } catch (error: any) {
        logger.error('Search suggestions error:', error);
        sendError(res, error.message || 'Error searching recipes', 500);
    }
};
