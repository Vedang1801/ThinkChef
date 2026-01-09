import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SDK with credentials from environment variables
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
});

// Create S3 instance
const s3 = new AWS.S3();

// S3 bucket configuration
export const S3_CONFIG = {
    bucket: process.env.S3_BUCKET_NAME || 'imagebucketforproject1',
    region: process.env.AWS_REGION || 'us-east-1',
};

export { s3 };
