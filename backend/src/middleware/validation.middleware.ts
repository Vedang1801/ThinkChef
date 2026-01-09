import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';
import { TagDetectionService } from '../services/tag.service';

/**
 * Validate registration request body
 */
export const validateRegistration = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        sendError(res, 'Username, email, and password are required', 400);
        return;
    }

    if (password.length < 6) {
        sendError(res, 'Password must be at least 6 characters long', 400);
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        sendError(res, 'Invalid email format', 400);
        return;
    }

    next();
};

/**
 * Validate login request body
 */
export const validateLogin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { email, password } = req.body;

    if (!email || !password) {
        sendError(res, 'Email and password are required', 400);
        return;
    }

    next();
};

export const validateRecipeCreation = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const { title, user_id, ingredients, cuisine_type, dietary_type, meal_types, difficulty } = req.body;

    if (!title || !user_id) {
        sendError(res, 'Title and user_id are required', 400);
        return;
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        sendError(res, 'At least one ingredient is required', 400);
        return;
    }

    // Validate cuisine type
    if (cuisine_type) {
        const validCuisines = TagDetectionService.getValidCuisines();
        if (!validCuisines.includes(cuisine_type.toLowerCase())) {
            sendError(res, `Invalid cuisine type. Valid options: ${validCuisines.join(', ')}`, 400);
            return;
        }
    }

    // Validate dietary type
    if (dietary_type) {
        const validDietary = ['vegan', 'vegetarian', 'eggetarian', 'pescatarian', 'non_vegetarian'];
        if (!validDietary.includes(dietary_type.toLowerCase())) {
            sendError(res, `Invalid dietary type. Valid options: ${validDietary.join(', ')}`, 400);
            return;
        }
    }

    // Validate meal types
    if (meal_types) {
        if (!Array.isArray(meal_types)) {
            sendError(res, 'Meal types must be an array', 400);
            return;
        }
        const validMealTypes = TagDetectionService.getValidMealTypes();
        const invalidTypes = meal_types.filter((type: string) => !validMealTypes.includes(type.toLowerCase()));
        if (invalidTypes.length > 0) {
            sendError(res, `Invalid meal type(s): ${invalidTypes.join(', ')}`, 400);
            return;
        }
    }

    // Validate difficulty
    if (difficulty) {
        const validDifficulties = TagDetectionService.getValidDifficulties();
        if (!validDifficulties.includes(difficulty.toLowerCase())) {
            sendError(res, `Invalid difficulty. Valid options: ${validDifficulties.join(', ')}`, 400);
            return;
        }
    }

    next();
};
