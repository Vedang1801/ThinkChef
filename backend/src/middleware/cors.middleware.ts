import cors from 'cors';
import { CORS_OPTIONS } from '../config/app.config';

/**
 * CORS middleware configuration
 */
export const corsMiddleware = cors(CORS_OPTIONS);
