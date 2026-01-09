import { Request } from 'express';

/**
 * Extended Express Request with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
    userId?: string;
    user?: {
        userId: string;
        username: string;
        email: string;
    };
}
