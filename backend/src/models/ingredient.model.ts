import pool from '../config/database.config';
import { Ingredient } from '../types/recipe.types';

/**
 * Get ingredients for a recipe
 */
export const getIngredientsByRecipeId = async (recipeId: number): Promise<Ingredient[]> => {
    const query = 'SELECT * FROM ingredients WHERE recipe_id = $1';
    const result = await pool.query(query, [recipeId]);
    return result.rows;
};

/**
 * Create ingredients for a recipe
 */
export const createIngredients = async (
    recipeId: number,
    ingredients: Array<{ item: string; quantity: string }>
): Promise<void> => {
    if (!ingredients || ingredients.length === 0) return;

    const values = ingredients.map((_, index) => {
        const offset = index * 3;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    }).join(', ');

    const query = `INSERT INTO ingredients (recipe_id, item, quantity) VALUES ${values}`;

    const params = ingredients.flatMap(ing => [recipeId, ing.item, ing.quantity]);

    await pool.query(query, params);
};

/**
 * Delete all ingredients for a recipe
 */
export const deleteIngredientsByRecipeId = async (recipeId: number): Promise<void> => {
    const query = 'DELETE FROM ingredients WHERE recipe_id = $1';
    await pool.query(query, [recipeId]);
};

/**
 * Get all ingredients (for frontend compatibility)
 */
export const getAllIngredients = async (): Promise<any[]> => {
    const query = 'SELECT * FROM ingredients ORDER BY recipe_id, ingredient_id';
    const result = await pool.query(query);
    return result.rows;
};
