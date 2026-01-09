import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.util';
import { sendError } from '../utils/response.util';

/**
 * Global error handling middleware
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    logger.error('Error occurred:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    sendError(res, message, statusCode);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    sendError(res, `Route ${req.originalUrl} not found`, 404);
};
