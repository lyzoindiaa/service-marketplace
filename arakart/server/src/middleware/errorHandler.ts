import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/responseHelper';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} [${errorCode}]: ${message}`, {
    stack: err.stack,
    details: err.details
  });

  if (statusCode === 500 && env.NODE_ENV === 'production') {
    sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
    return;
  }

  sendError(
    res,
    message,
    statusCode,
    errorCode,
    env.NODE_ENV === 'development' ? err.details || err.stack : err.details
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};
