import pool from '../config/database.config';

export interface Rating {
    rating_id: number;
    recipe_id: number;
    user_id: string;
    stars: number;
    created_at: Date;
}

/**
 * Create a rating for a recipe
 */
export const createRating = async (
    recipeId: number,
    userId: string,
    stars: number
): Promise<void> => {
    const query = `
    INSERT INTO ratings (recipe_id, user_id, stars)
    VALUES ($1, $2, $3)
  `;
    await pool.query(query, [recipeId, userId, stars]);
};

/**
 * Get average rating for a recipe
 */
export const getAverageRating = async (recipeId: number): Promise<number> => {
    const query = `
    SELECT AVG(stars) AS average_rating 
    FROM ratings 
    WHERE recipe_id = $1
  `;
    const result = await pool.query(query, [recipeId]);
    return result.rows[0]?.average_rating || 0;
};

/**
 * Check if user has rated a recipe
 */
export const getUserRating = async (
    recipeId: number,
    userId: string
): Promise<{ hasRated: boolean; userRating?: number }> => {
    const query = `
    SELECT stars 
    FROM ratings 
    WHERE recipe_id = $1 AND user_id = $2
  `;
    const result = await pool.query(query, [recipeId, userId]);

    if (result.rows.length === 0) {
        return { hasRated: false };
    }

    return {
        hasRated: true,
        userRating: result.rows[0].stars,
    };
};
