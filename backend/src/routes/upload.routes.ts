import { Router } from 'express';
import multer from 'multer';
import * as uploadController from '../controllers/upload.controller';
import { uploadLimiter } from '../middleware/rateLimit.middleware';
import { APP_CONFIG } from '../config/app.config';

const router = Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload-image - Upload an image to S3 (with rate limiting)
router.post('/upload-image', uploadLimiter, upload.single('image'), uploadController.uploadImage);

export default router;
