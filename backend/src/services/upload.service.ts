import { s3, S3_CONFIG } from '../config/aws.config';
import fs from 'fs';

/**
 * Upload a file to S3
 */
export const uploadToS3 = async (
    file: any
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Read the file from disk
        fs.readFile(file.path, (err, data) => {
            if (err) {
                return reject(new Error('Error reading file'));
            }

            const params = {
                Bucket: S3_CONFIG.bucket,
                Key: `images/${file.originalname}`,
                Body: data,
                ContentType: file.mimetype,
            };

            // Upload file to S3
            s3.upload(params, (uploadErr: any, s3Data: any) => {
                if (uploadErr) {
                    return reject(new Error('Error uploading file to S3'));
                }

                // Delete the file from disk after uploading to S3
                fs.unlink(file.path, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting file from disk:', unlinkErr);
                    }
                });

                resolve(s3Data.Location);
            });
        });
    });
};
