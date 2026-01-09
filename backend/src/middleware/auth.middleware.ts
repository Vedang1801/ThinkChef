import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.d';
import { verifyToken } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';

/**
 * Middleware to verify JWT token and authenticate requests
 */
export const authenticateToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        sendError(res, 'Unauthorized: No token provided', 401);
        return;
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        sendError(res, 'Unauthorized: Invalid or expired token', 401);
        return;
    }

    // Attach user information to request
    req.userId = decoded.userId;
    req.user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
    };

    next();
};
