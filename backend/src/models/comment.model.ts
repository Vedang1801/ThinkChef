import pool from '../config/database.config';

export interface Comment {
    comment_id: number;
    comment_text: string;
    user_id: string;
    recipe_id: number;
    username: string;
    created_at: Date;
}

/**
 * Get comments for a recipe
 */
export const getCommentsByRecipeId = async (recipeId: number): Promise<Comment[]> => {
    const query = 'SELECT * FROM comments WHERE recipe_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [recipeId]);
    return result.rows;
};

/**
 * Create a comment for a recipe
 */
export const createComment = async (
    recipeId: number,
    userId: string,
    username: string,
    commentText: string
): Promise<void> => {
    const query = `
    INSERT INTO comments (comment_text, user_id, recipe_id, username)
    VALUES ($1, $2, $3, $4)
  `;
    await pool.query(query, [commentText, userId, recipeId, username]);
};
