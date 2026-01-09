import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRegistration, validateLogin } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

// POST /api/register - Register a new user (with strict rate limiting)
router.post('/register', authLimiter, validateRegistration, authController.register);

// POST /api/login - Login a user (with strict rate limiting)
router.post('/login', authLimiter, validateLogin, authController.login);

export default router;
