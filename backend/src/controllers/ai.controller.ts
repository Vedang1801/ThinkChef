import { Request, Response } from 'express';
import * as aiService from '../services/ai.service';
import { sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Generate a recipe using AI
 */
export const generateRecipe = async (req: Request, res: Response): Promise<void> => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            sendError(res, 'Please provide a valid array of ingredients', 400);
            return;
        }

        const recipe = await aiService.generateRecipe(ingredients);

        res.status(200).json({
            success: true,
            recipe,
        });
    } catch (error: any) {
        logger.error('Recipe generation error:', error);
        sendError(res, error.message || 'Failed to generate recipe', 500);
    }
};
