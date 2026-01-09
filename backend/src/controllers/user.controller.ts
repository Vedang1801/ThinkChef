import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Sync Firebase user with database
 */
export const syncUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_id, username, email, provider } = req.body;

        if (!user_id || !email) {
            sendError(res, 'User ID and email are required', 400);
            return;
        }

        const result = await userService.syncUser(user_id, username, email, provider);

        res.status(result.message === 'User created' ? 201 : 200).json(result);
    } catch (error: any) {
        logger.error('User sync error:', error);

        if (error.message === 'Email already in use by another account') {
            sendError(res, error.message, 409);
        } else {
            sendError(res, 'Error synchronizing user', 500);
        }
    }
};
