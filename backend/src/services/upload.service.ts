import { s3, S3_CONFIG } from '../config/aws.config';
import fs from 'fs';

/**
 * Upload a file to S3
 */
export const uploadToS3 = async (
    file: any
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadParams = {
            Bucket: S3_CONFIG.bucket,
            Key: `images/${Date.now()}-${file.originalname}`, // Added timestamp to prevent overwrites
            Body: file.buffer, // Use buffer directly
            ContentType: file.mimetype,
        };

        // If file.buffer is missing (e.g. disk storage), we might need fs.readFile. 
        // But since routes use memoryStorage, file.buffer will be present.
        // If we want to support disk storage fallback:
        if (!file.buffer && file.path) {
            fs.readFile(file.path, (err, data) => {
                if (err) return reject(new Error('Error reading file'));
                uploadParams.Body = data;
                performUpload(uploadParams, file.path, resolve, reject);
            });
        } else {
            performUpload(uploadParams, null, resolve, reject);
        }
    });
};

const performUpload = (params: any, filePath: string | null, resolve: any, reject: any) => {
    s3.upload(params, (err: any, data: any) => {
        if (err) {
            return reject(new Error('Error uploading file to S3: ' + err.message));
        }

        // If file was on disk, delete it
        if (filePath) {
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error('Error deleting file from disk:', unlinkErr);
            });
        }

        resolve(data.Location);
    });
};
