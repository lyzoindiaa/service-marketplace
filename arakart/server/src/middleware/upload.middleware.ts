import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * Middleware handling single photo upload with 422 error transformation.
 */
export const uploadSinglePhoto = (fieldName = 'photo') => {
  const multerMiddleware = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req as any, res as any, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(422).json({
            success: false,
            message: 'File size too large. Maximum size is 2MB.',
          });
        }
        return res.status(422).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      next();
    });
  };
};
