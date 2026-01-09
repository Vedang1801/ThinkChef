import * as recipeModel from '../models/recipe.model';
import * as ingredientModel from '../models/ingredient.model';
import { CreateRecipeDTO, UpdateRecipeDTO, RecipeListResponse } from '../types/recipe.types';
import { TagDetectionService } from './tag.service';
import pool from '../config/database.config';

/**
 * Get all recipes with pagination and search
 */
export const getAllRecipes = async (
    page: number,
    limit: number,
    searchTerm: string
): Promise<RecipeListResponse> => {
    return recipeModel.getAllRecipes(page, limit, searchTerm);
};

/**
 * Get recipes by user ID
 */
export const getRecipesByUserId = async (userId: string) => {
    return recipeModel.getRecipesByUserId(userId);
};

/**
 * Get recipe by ID with ingredients
 */
export const getRecipeById = async (recipeId: number) => {
    const recipe = await recipeModel.getRecipeById(recipeId);
    if (!recipe) {
        throw new Error('Recipe not found');
    }

    const ingredients = await ingredientModel.getIngredientsByRecipeId(recipeId);
    return { ...recipe, ingredients };
};

/**
 * Create a new recipe with ingredients
 * Automatically detects dietary type if not provided
 */
export const createRecipe = async (recipeData: CreateRecipeDTO): Promise<void> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Auto-detect dietary type if not provided or validate if provided
        if (!recipeData.dietary_type) {
            recipeData.dietary_type = TagDetectionService.detectDietaryType(recipeData.ingredients);
        } else {
            // Validate user-provided dietary type
            const validation = TagDetectionService.validateDietaryType(
                recipeData.dietary_type,
                recipeData.ingredients
            );
            // Note: We allow user override but log the warning
            if (!validation.valid) {
                console.warn(`Dietary type mismatch: ${validation.warning}`);
            }
        }

        // Create recipe
        const recipeId = await recipeModel.createRecipe(recipeData);

        // Create ingredients
        await ingredientModel.createIngredients(recipeId, recipeData.ingredients);

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Update a recipe with ingredients
 */
export const updateRecipe = async (
    recipeId: number,
    updateData: UpdateRecipeDTO
): Promise<void> => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Update recipe
        await recipeModel.updateRecipe(
            recipeId,
            updateData.title,
            updateData.description || '',
            updateData.instruction,
            updateData.image || '',
            updateData.totalTime || '',
            updateData.servings || '',
            updateData.cuisine_type || null,
            updateData.dietary_type || null,
            updateData.meal_types || null,
            updateData.difficulty || null
        );

        // Delete old ingredients
        await ingredientModel.deleteIngredientsByRecipeId(recipeId);

        // Create new ingredients
        if (updateData.ingredients && updateData.ingredients.length > 0) {
            await ingredientModel.createIngredients(recipeId, updateData.ingredients);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Delete a recipe
 */
export const deleteRecipe = async (recipeId: number): Promise<void> => {
    return recipeModel.deleteRecipe(recipeId);
};

/**
 * Get all ingredients (for frontend compatibility)
 */
export const getAllIngredients = async (): Promise<any[]> => {
    return await ingredientModel.getAllIngredients();
};

/**
 * Get sorted recipes
 */
export const getSortedRecipes = async (
    sortType: string,
    page: number,
    limit: number,
    searchTerm: string
): Promise<RecipeListResponse> => {
    return recipeModel.getSortedRecipes(sortType, page, limit, searchTerm);
};

/**
 * Search recipes for suggestions
 */
export const searchRecipeSuggestions = async (searchTerm: string) => {
    return recipeModel.searchRecipeSuggestions(searchTerm);
};

/**
 * Get ingredients for a recipe
 */
export const getIngredientsByRecipeId = async (recipeId: number) => {
    return ingredientModel.getIngredientsByRecipeId(recipeId);
};
