import pool from '../config/database.config';
import { Recipe, CreateRecipeDTO, RecipeListResponse } from '../types/recipe.types';

/**
 * Get all recipes with pagination and search
 */
export const getAllRecipes = async (
  page: number = 1,
  limit: number = 12,
  searchTerm: string = ''
): Promise<RecipeListResponse> => {
  const offset = (page - 1) * limit;
  const searchPattern = `%${searchTerm}%`;

  // Count total recipes
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT r.recipe_id
      FROM recipes r 
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
      WHERE r.title ILIKE $1 OR r.description ILIKE $1
      GROUP BY r.recipe_id
    ) as counted_recipes
  `;

  const countResult = await pool.query(countQuery, [searchPattern]);
  const totalRecipes = parseInt(countResult.rows[0]?.total || 0, 10);
  const totalPages = Math.ceil(totalRecipes / limit) || 1;

  if (totalRecipes === 0) {
    return {
      recipes: [],
      currentPage: page,
      totalPages: 1,
      totalRecipes: 0,
      limit,
    };
  }

  // Get recipes
  const query = `
    SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
    FROM recipes r 
    LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
    LEFT JOIN users u ON r.user_id = u.user_id
    WHERE r.title ILIKE $1 OR r.description ILIKE $1
    GROUP BY r.recipe_id, u.username
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, [searchPattern, limit, offset]);

  return {
    recipes: result.rows,
    currentPage: page,
    totalPages,
    totalRecipes,
    limit,
  };
};

/**
 * Get recipes by user ID
 */
export const getRecipesByUserId = async (userId: string): Promise<Recipe[]> => {
  const query = `
    SELECT recipe_id, title, description, user_id, image, instruction, created_at,
           total_time as "totalTime", servings, 
           cuisine_type, dietary_type, meal_types, difficulty
    FROM recipes 
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

/**
 * Get a single recipe by ID
 */
export const getRecipeById = async (recipeId: number): Promise<Recipe | null> => {
  const query = 'SELECT * FROM recipes WHERE recipe_id = $1';
  const result = await pool.query(query, [recipeId]);
  return result.rows[0] || null;
};

/**
 * Create a new recipe
 */
export const createRecipe = async (recipeData: CreateRecipeDTO): Promise<number> => {
  const {
    title, description, user_id, image, instructions, totalTime, servings,
    cuisine_type, dietary_type, meal_types, difficulty
  } = recipeData;

  const query = `
    INSERT INTO recipes (
        title, description, user_id, image, instruction, total_time, servings,
        cuisine_type, dietary_type, meal_types, difficulty
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING recipe_id
  `;

  const result = await pool.query(query, [
    title,
    description,
    user_id,
    image,
    instructions,
    totalTime,
    servings,
    cuisine_type || null,
    dietary_type || 'vegetarian',
    meal_types || null,
    difficulty || null
  ]);

  return result.rows[0].recipe_id;
};

/**
 * Update a recipe
 */
export const updateRecipe = async (
  recipeId: number,
  title: string,
  description: string,
  instruction: string,
  image: string,
  totalTime: string,
  servings: string,
  cuisine_type?: string | null,
  dietary_type?: string | null,
  meal_types?: string[] | null,
  difficulty?: string | null
): Promise<void> => {
  const query = `
    UPDATE recipes 
    SET title = $1, description = $2, instruction = $3, image = $4, total_time = $5, servings = $6,
        cuisine_type = $7, dietary_type = $8, meal_types = $9, difficulty = $10
    WHERE recipe_id = $11
  `;

  await pool.query(query, [
    title, description, instruction, image, totalTime, servings,
    cuisine_type, dietary_type, meal_types, difficulty,
    recipeId
  ]);
};

/**
 * Delete a recipe
 */
export const deleteRecipe = async (recipeId: number): Promise<void> => {
  const query = 'DELETE FROM recipes WHERE recipe_id = $1';
  await pool.query(query, [recipeId]);
};

/**
 * Get sorted recipes
 */
export const getSortedRecipes = async (
  sortType: string,
  page: number = 1,
  limit: number = 12,
  searchTerm: string = ''
): Promise<RecipeListResponse> => {
  const offset = (page - 1) * limit;
  const searchPattern = `%${searchTerm}%`;

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT r.recipe_id
      FROM recipes r 
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
      WHERE r.title ILIKE $1 OR r.description ILIKE $1
      GROUP BY r.recipe_id
    ) as counted_recipes
  `;

  const countResult = await pool.query(countQuery, [searchPattern]);
  const totalRecipes = parseInt(countResult.rows[0]?.total || 0, 10);
  const totalPages = Math.ceil(totalRecipes / limit) || 1;

  let query: string;

  switch (sortType) {
    case 'top-rated':
    case 'rating-desc':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY average_rating DESC
        LIMIT $2 OFFSET $3
      `;
      break;
    case 'rating-asc':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY average_rating ASC
        LIMIT $2 OFFSET $3
      `;
      break;
    case 'newest':
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      break;
    case 'oldest':
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        ORDER BY r.created_at ASC
        LIMIT $2 OFFSET $3
      `;
      break;
    default:
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        LIMIT $2 OFFSET $3
      `;
  }

  const result = await pool.query(query, [searchPattern, limit, offset]);

  return {
    recipes: result.rows,
    currentPage: page,
    totalPages,
    totalRecipes,
    limit,
  };
};

/**
 * Search recipes for suggestions
 */
export const searchRecipeSuggestions = async (searchTerm: string): Promise<Recipe[]> => {
  const query = `
    SELECT recipe_id, title, description 
    FROM recipes 
    WHERE LOWER(title) LIKE LOWER($1) 
    OR LOWER(description) LIKE LOWER($1)
    LIMIT 5
  `;

  const searchPattern = `%${searchTerm}%`;
  const result = await pool.query(query, [searchPattern]);
  return result.rows;
};
