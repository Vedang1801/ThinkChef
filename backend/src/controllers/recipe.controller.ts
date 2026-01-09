import { Request, Response } from 'express';
import * as recipeService from '../services/recipe.service';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Get all recipes with pagination and search
 */
export const getAllRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const searchTerm = (req.query.search as string) || '';

        const result = await recipeService.getAllRecipes(page, limit, searchTerm);

        res.status(200).json(result);
    } catch (error: any) {
        logger.error('Get all recipes error:', error);
        sendError(res, error.message || 'Error retrieving recipes', 500);
    }
};

/**
 * Get recipes by user ID
 */
export const getRecipesByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.id;

        const recipes = await recipeService.getRecipesByUserId(userId);

        res.status(200).json(recipes);
    } catch (error: any) {
        logger.error('Get recipes by user error:', error);
        sendError(res, error.message || 'Error retrieving recipes', 500);
    }
};

/**
 * Get ingredients for a recipe
 */
export const getIngredients = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);

        const ingredients = await recipeService.getIngredientsByRecipeId(recipeId);

        res.status(200).json(ingredients);
    } catch (error: any) {
        logger.error('Get ingredients error:', error);
        sendError(res, error.message || 'Error retrieving ingredients', 500);
    }
};

/**
 * Create a new recipe
 */
import { TagDetectionService } from '../services/tag.service';

/**
 * Create a new recipe
 */
export const createRecipe = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            title, description, user_id, image, instructions, totalTime, servings, ingredients,
            cuisine_type, meal_types, difficulty
        } = req.body;

        let { dietary_type } = req.body;

        // Level 2 Defense: Backend Auto-Categorization
        // Uses TagDetectionService which correctly handles Pescatarian vs Non-Veg
        if (ingredients && ingredients.length > 0) {
            // Only auto-detect if not provided, OR validate/warn if provided
            // But to fix the issue where user selection might be wrong or we want to enforce truth:
            // Let's trust the refined TagDetectionService. 
            // However, the service returns 'vegan' by default if empty. 

            const detectedType = TagDetectionService.detectDietaryType(ingredients);

            // If user didn't select one, use detected
            if (!dietary_type) {
                dietary_type = detectedType;
            } else {
                // If user selected one, check if it's a conflict
                const validation = TagDetectionService.validateDietaryType(dietary_type, ingredients);
                if (!validation.valid) {
                    logger.info(`Auto-corrected recipe "${title}" from ${dietary_type} to ${validation.detected} due to conflict: ${validation.warning}`);
                    dietary_type = validation.detected;
                }
            }
        }

        await recipeService.createRecipe({
            title,
            description,
            user_id,
            image,
            instructions,
            totalTime,
            servings,
            ingredients,
            cuisine_type,
            dietary_type,
            meal_types,
            difficulty
        });

        sendSuccess(res, null, 'Recipe created successfully', 201);
    } catch (error: any) {
        logger.error('Create recipe error:', error);
        sendError(res, error.message || 'Error creating recipe', 500);
    }
};

/**
 * Update a recipe
 */
export const updateRecipe = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);
        const {
            title, description, instruction, ingredients, image, totalTime, servings,
            cuisine_type, meal_types, difficulty
        } = req.body;

        let { dietary_type } = req.body;

        // Level 2 Defense: Backend Auto-Categorization for Updates
        // Uses TagDetectionService which correctly handles Pescatarian vs Non-Veg
        if (ingredients && ingredients.length > 0) {
            const detectedType = TagDetectionService.detectDietaryType(ingredients);

            // If user didn't select one, use detected
            if (!dietary_type) {
                dietary_type = detectedType;
            } else {
                // If user selected one, check if it's a conflict
                const validation = TagDetectionService.validateDietaryType(dietary_type, ingredients);
                if (!validation.valid) {
                    logger.info(`Auto-corrected recipe update ID ${recipeId} from ${dietary_type} to ${validation.detected} due to conflict: ${validation.warning}`);
                    dietary_type = validation.detected;
                }
            }
        }

        await recipeService.updateRecipe(recipeId, {
            title,
            description,
            instruction,
            image,
            totalTime,
            servings,
            ingredients,
            cuisine_type,
            dietary_type,
            meal_types,
            difficulty
        });

        sendSuccess(res, null, 'Recipe updated successfully', 200);
    } catch (error: any) {
        logger.error('Update recipe error:', error);
        sendError(res, error.message || 'Error updating recipe', 500);
    }
};

/**
 * Delete a recipe by ID
 */
export const deleteRecipe = async (req: Request, res: Response): Promise<void> => {
    try {
        const recipeId = parseInt(req.params.id);

        await recipeService.deleteRecipe(recipeId);

        sendSuccess(res, 'Recipe deleted successfully');
    } catch (error: any) {
        logger.error('Delete recipe error:', error);
        sendError(res, error.message || 'Error deleting recipe', 500);
    }
};

/**
 * Get all ingredients (for frontend compatibility)
 */
export const getAllIngredients = async (req: Request, res: Response): Promise<void> => {
    try {
        const ingredients = await recipeService.getAllIngredients();
        res.status(200).json(ingredients);
    } catch (error: any) {
        logger.error('Get all ingredients error:', error);
        sendError(res, error.message || 'Error fetching ingredients', 500);
    }
};

/**
 * Get sorted recipes
 */
export const getSortedRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const sortType = req.params.type;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 12;
        const searchTerm = (req.query.search as string) || '';

        const result = await recipeService.getSortedRecipes(sortType, page, limit, searchTerm);

        res.status(200).json(result);
    } catch (error: any) {
        logger.error('Get sorted recipes error:', error);
        sendError(res, error.message || 'Error retrieving recipes', 500);
    }
};

// Export filter controller
export { filterRecipes } from './filter.controller';
