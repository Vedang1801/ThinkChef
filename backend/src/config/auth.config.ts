import dotenv from 'dotenv';

dotenv.config();

// Authentication configuration
export const AUTH_CONFIG = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
};

// Validate required environment variables
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: JWT_SECRET not set in production environment!');
}
