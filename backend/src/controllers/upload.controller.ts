import { Request, Response } from 'express';
import * as uploadService from '../services/upload.service';
import { sendError } from '../utils/response.util';
import logger from '../utils/logger.util';

/**
 * Upload an image to S3
 */
export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const file = req.file;

        if (!file) {
            sendError(res, 'No file uploaded', 400);
            return;
        }

        const imageUrl = await uploadService.uploadToS3(file);

        res.status(200).json({ imageUrl });
    } catch (error: any) {
        logger.error('Upload image error:', error);
        sendError(res, error.message || 'Error uploading file', 500);
    }
};
