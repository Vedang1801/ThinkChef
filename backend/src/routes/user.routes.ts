import { Router } from 'express';
import * as userController from '../controllers/user.controller';

const router = Router();

// POST /api/users/sync - Sync Firebase user with database
router.post('/sync', userController.syncUser);

export default router;
