import bcrypt from 'bcrypt';
import { AUTH_CONFIG } from '../config/auth.config';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, AUTH_CONFIG.bcryptSaltRounds);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};
