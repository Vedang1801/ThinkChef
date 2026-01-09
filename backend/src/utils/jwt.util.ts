import jwt from 'jsonwebtoken';
import { AUTH_CONFIG } from '../config/auth.config';

export interface JWTPayload {
    userId: string;
    username: string;
    email: string;
}

/**
 * Generate a JWT token for a user
 */
export const generateToken = (payload: JWTPayload): string => {
    return jwt.sign(payload, AUTH_CONFIG.jwtSecret, {
        expiresIn: AUTH_CONFIG.jwtExpiresIn,
    } as any);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
    try {
        const decoded = jwt.verify(token, AUTH_CONFIG.jwtSecret) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
};
