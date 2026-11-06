import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/responseHelper';

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        sendError(res, 'Validation failed', 400, undefined, { errors: issues });
        return;
      }
      sendError(res, 'Invalid request data', 400);
    }
  };
};
