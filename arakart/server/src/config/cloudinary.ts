import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { logger } from '../utils/logger';

// Configure Cloudinary if credentials provided
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads an image buffer to Cloudinary (or returns a deterministic mock URL if no credentials set).
 */
export const uploadPhotoToCloudinary = async (
  buffer: Buffer,
  mimetype: string
): Promise<string> => {
  // If Cloudinary credentials are not configured (local dev/testing), generate local mock URL
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    const timestamp = Date.now();
    const ext = mimetype.split('/')[1] || 'webp';
    return `https://res.cloudinary.com/arakart/image/upload/v1/mock_photo_${timestamp}.${ext}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'arakart/providers',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'webp' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload error:', error);
          return reject(new Error('Failed to upload image to cloud storage'));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary by public ID or URL (safe mock in local dev/testing).
 */
export const deletePhotoFromCloudinary = async (photoUrl: string): Promise<void> => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return;
  }

  try {
    // Extract public ID from Cloudinary URL (e.g., folder/filename without extension)
    const urlParts = photoUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && urlParts.length > uploadIndex + 2) {
      const publicPath = urlParts.slice(uploadIndex + 2).join('/');
      const publicId = publicPath.substring(0, publicPath.lastIndexOf('.')) || publicPath;
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    logger.error('Cloudinary photo deletion error:', err);
  }
};
