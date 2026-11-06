import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const allowedMimetypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const dangerousSubExtensions = /\.(php|phtml|js|mjs|cjs|ts|html|htm|svg|xml|sh|bat|cmd|exe|dll|py|rb|pl|jsp|asp|aspx)\./i;

/**
 * Inspects binary magic bytes of a file buffer to determine the actual image format.
 * Prevents attackers from renaming HTML/SVG/PHP/JS scripts to .jpg/.png and spoofing Content-Type.
 */
export const detectImageMimeFromMagicBytes = (buffer: Buffer): string | null => {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: "RIFF" (52 49 46 46) at 0..3 and "WEBP" (57 45 42 50) at 8..11
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
};

/**
 * Scans image buffer for embedded script/polyglot payloads (e.g. JPEG magic bytes followed by <script> or <?php).
 */
export const containsEmbeddedScriptPayload = (buffer: Buffer): boolean => {
  const sample = buffer.toString('utf8');
  const scriptPatterns = [
    /<script[\s>]/i,
    /<\/script>/i,
    /<\?php/i,
    /<svg[\s>]/i,
    /javascript\s*:/i,
    /on(load|error|mouseover|click)\s*=/i,
    /<iframe[\s>]/i,
    /<!doctype\s+html/i,
    /<html[\s>]/i,
  ];
  return scriptPatterns.some((pattern) => pattern.test(sample));
};

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (_req, file, cb) => {
    const originalName = file.originalname || '';
    const ext = path.extname(originalName).toLowerCase();

    if (!allowedMimetypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Only JPEG, PNG, and WebP are allowed.'));
    }

    if (
      originalName.includes('..') ||
      !allowedExtensions.includes(ext) ||
      dangerousSubExtensions.test(originalName)
    ) {
      return cb(
        new Error('Invalid file extension. Only JPEG, PNG, and WebP (.jpg, .jpeg, .png, .webp) files are allowed.')
      );
    }

    cb(null, true);
  },
});

/**
 * Middleware handling single photo upload with:
 * 1. Extension + double-extension check
 * 2. MIME type check
 * 3. Binary magic-byte signature verification
 * 4. Polyglot / embedded script payload inspection
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

      if (req.file && req.file.buffer) {
        const detectedMime = detectImageMimeFromMagicBytes(req.file.buffer);
        if (!detectedMime || detectedMime !== req.file.mimetype) {
          return res.status(422).json({
            success: false,
            message:
              'File signature mismatch: the uploaded file content does not match a valid JPEG, PNG, or WebP image.',
          });
        }

        if (containsEmbeddedScriptPayload(req.file.buffer)) {
          return res.status(422).json({
            success: false,
            message: 'Security violation: embedded script or executable content detected in file.',
          });
        }
      }

      next();
    });
  };
};
