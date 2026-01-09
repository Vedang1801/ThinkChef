import * as commentModel from '../models/comment.model';

/**
 * Get comments for a recipe
 */
export const getCommentsByRecipeId = async (recipeId: number) => {
    return commentModel.getCommentsByRecipeId(recipeId);
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
    if (!commentText || commentText.trim().length === 0) {
        throw new Error('Comment text cannot be empty');
    }

    return commentModel.createComment(recipeId, userId, username, commentText);
};
