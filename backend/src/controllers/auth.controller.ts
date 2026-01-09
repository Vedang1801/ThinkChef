import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, email, password } = req.body;

        await authService.registerUser({ username, email, password });

        sendSuccess(res, null, 'User registered successfully', 201);
    } catch (error: any) {
        logger.error('Registration error:', error);
        sendError(res, error.message || 'Error registering user', 500);
    }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const result = await authService.loginUser({ email, password });

        sendSuccess(res, result, 'Login successful', 200);
    } catch (error: any) {
        logger.error('Login error:', error);
        sendError(res, error.message || 'Error logging in', 401);
    }
};
