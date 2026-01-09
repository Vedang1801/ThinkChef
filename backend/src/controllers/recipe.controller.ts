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
// Helper to detect dietary conflicts
const detectDietaryType = (ingredients: any[]) => {
    const NON_VEG_KEYWORDS = [
        'chicken', 'meat', 'beef', 'pork', 'lamb', 'fish', 'salmon',
        'tuna', 'shrimp', 'prawn', 'bacon', 'ham', 'sausage', 'steak',
        'turkey', 'duck', 'mutton', 'seafood', 'crab', 'lobster'
    ];

    const DAIRY_KEYWORDS = [
        'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
        'ghee', 'paneer', 'curd', 'whey', 'lactose', 'dairy',
        'mozzarella', 'cheddar', 'parmesan', 'ricotta', 'feta',
        'sour cream', 'ice cream', 'condensed milk', 'evaporated milk'
    ];

    const EGG_KEYWORDS = [
        'egg', 'eggs', 'egg white', 'egg yolk', 'mayonnaise', 'mayo'
    ];

    // Normalize ingredients to string array for checking
    const ingredientStrings = ingredients.map(ing =>
        (typeof ing === 'string' ? ing : ing.item || '').toLowerCase()
    );

    const combinedString = ingredientStrings.join(' ');

    // Hierarchical check: meat/fish > eggs > dairy
    const hasMeat = NON_VEG_KEYWORDS.some(keyword => combinedString.includes(keyword));
    if (hasMeat) {
        return 'non_vegetarian';
    }

    const hasEggs = EGG_KEYWORDS.some(keyword => combinedString.includes(keyword));
    if (hasEggs) {
        return 'eggetarian'; // Has eggs (not vegetarian!)
    }

    const hasDairy = DAIRY_KEYWORDS.some(keyword => combinedString.includes(keyword));
    if (hasDairy) {
        return 'vegetarian'; // Has dairy only, no eggs or meat
    }

    return null; // Clean ingredients, keep user selection
};

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
        // Hierarchical: meat → non-veg, dairy/eggs → vegetarian, clean → keep user choice
        if (ingredients && ingredients.length > 0) {
            const detectedType = detectDietaryType(ingredients);
            if (detectedType) {
                if (detectedType !== dietary_type) {
                    logger.info(`Auto-corrected recipe "${title}" from ${dietary_type} to ${detectedType} based on ingredients.`);
                }
                dietary_type = detectedType;
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
        // Hierarchical: meat → non-veg, dairy/eggs → vegetarian, clean → keep user choice
        if (ingredients && ingredients.length > 0) {
            const detectedType = detectDietaryType(ingredients);
            if (detectedType) {
                if (detectedType !== dietary_type) {
                    logger.info(`Auto-corrected recipe update ID ${recipeId} from ${dietary_type} to ${detectedType} based on ingredients.`);
                }
                dietary_type = detectedType;
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
