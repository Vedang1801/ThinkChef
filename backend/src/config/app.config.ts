import dotenv from 'dotenv';

dotenv.config();

// Application configuration
export const APP_CONFIG = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    uploadDir: process.env.UPLOAD_DIR || 'uploads/',
};

// CORS configuration
export const CORS_OPTIONS = {
    origin: APP_CONFIG.nodeEnv === 'production'
        ? APP_CONFIG.corsOrigin
        : true, // Allow all origins in development
    credentials: true,
    optionsSuccessStatus: 200,
};
