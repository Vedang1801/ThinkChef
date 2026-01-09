import express, { Application } from 'express';
import bodyParser from 'body-parser';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import routes from './routes';
import logger from './utils/logger.util';
import * as recipeController from './controllers/recipe.controller';

/**
 * Create and configure Express application
 */
const createApp = (): Application => {
    const app = express();

    // Middleware
    app.use(corsMiddleware);
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Request logging
    app.use((req, _res, next) => {
        logger.info(`${req.method} ${req.path}`);
        next();
    });

    // Health check endpoint (no rate limit)
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString()
        });
    });

    // Apply rate limiting to all API routes
    app.use('/api/', apiLimiter);

    // Ingredients endpoint (for frontend compatibility)
    app.get('/api/ingredients', recipeController.getAllIngredients);

    // Mount all routes
    app.use(routes);

    // Error handling (must be last)
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
};

export default createApp;
