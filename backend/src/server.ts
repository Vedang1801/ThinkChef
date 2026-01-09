// CI/CD Pipeline Test - Safe deployment verification
import createApp from './app';
import { APP_CONFIG } from './config/app.config';
import logger from './utils/logger.util';
import pool from './config/database.config';

/**
 * Start the HTTP server
 */
const startServer = async () => {
    try {
        // Test database connection
        await pool.query('SELECT NOW()');
        logger.info('Database connection established');

        // Create Express app
        const app = createApp();

        // Start server
        app.listen(APP_CONFIG.port, () => {
            logger.info(`🚀 Server is running on port ${APP_CONFIG.port}`);
            logger.info(`📝 Environment: ${APP_CONFIG.nodeEnv}`);
            logger.info(`🌐 CORS Origin: ${APP_CONFIG.corsOrigin}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer();
