import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  details?: any;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message })
  };
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400,
  code?: string,
  details?: any
): Response => {
  const payload: ApiResponse = {
    success: false,
    error,
    ...(code && { code }),
    ...(details && { details })
  };
  return res.status(statusCode).json(payload);
};
