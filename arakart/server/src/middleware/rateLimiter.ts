import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/responseHelper';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests from this IP, please try again after 15 minutes', 429, 'RATE_LIMIT_EXCEEDED');
  }
});

export const authCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many verification code attempts, please try again later', 429, 'AUTH_RATE_LIMIT');
  }
});
