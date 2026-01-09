import { Request, Response } from 'express';
import pool from '../config/database.config';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Filter recipes by tags
 * GET /api/recipes/filter?cuisine=italian&dietary=vegetarian&meal=dinner&difficulty=easy&page=1
 */
export const filterRecipes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { cuisine, dietary, meal, difficulty } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 12;
        const offset = (page - 1) * limit;

        // Build WHERE clause dynamically
        const conditions: string[] = ['1=1']; // Always true condition to start
        const params: any[] = [];
        let paramIndex = 1;

        if (cuisine) {
            conditions.push(`cuisine_type = $${paramIndex}`);
            params.push(cuisine);
            paramIndex++;
        }

        if (dietary) {
            conditions.push(`dietary_type = $${paramIndex}`);
            params.push(dietary);
            paramIndex++;
        }

        if (meal) {
            conditions.push(`$${paramIndex} = ANY(meal_types)`);
            params.push(meal);
            paramIndex++;
        }

        if (difficulty) {
            conditions.push(`difficulty = $${paramIndex}`);
            params.push(difficulty);
            paramIndex++;
        }

        const whereClause = conditions.join(' AND ');

        // Count total matching recipes
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM recipes 
            WHERE ${whereClause}
        `;
        const countResult = await pool.query(countQuery, params);
        const totalRecipes = parseInt(countResult.rows[0]?.total || 0, 10);
        const totalPages = Math.ceil(totalRecipes / limit) || 1;

        // Get filtered recipes
        const query = `
            SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author
            FROM recipes r
            LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
            LEFT JOIN users u ON r.user_id = u.user_id
            WHERE ${whereClause}
            GROUP BY r.recipe_id, u.username
            ORDER BY r.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, [...params, limit, offset]);

        res.status(200).json({
            recipes: result.rows,
            currentPage: page,
            totalPages,
            totalRecipes,
            limit,
            filters: { cuisine, dietary, meal, difficulty }
        });
    } catch (error: any) {
        logger.error('Filter recipes error:', error);
        sendError(res, error.message || 'Error filtering recipes', 500);
    }
};
