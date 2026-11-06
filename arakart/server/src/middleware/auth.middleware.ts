import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { sendError } from '../utils/responseHelper';
import { User, UserRole } from '../models/User.model';

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication token required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 'Malformed authentication token', 401);
      return;
    }

    const payload = verifyAccessToken(token);

    // Ensure user is not suspended
    const user = await User.findById(payload.userId).select('suspended');
    if (!user) {
      sendError(res, 'User account no longer exists', 401);
      return;
    }
    if (user.suspended) {
      sendError(res, 'Account has been suspended. Please contact support.', 403);
      return;
    }

    req.user = payload;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Access token has expired. Please refresh your session.', 401);
      return;
    }
    sendError(res, 'Invalid authentication token', 401);
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, `Access denied: requires one of the following roles: ${roles.join(', ')}`, 403);
      return;
    }

    next();
  };
};
