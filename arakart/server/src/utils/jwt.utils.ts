import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { UserRole } from '../models/User.model';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  sellerId?: string | null;
  jti?: string;
}

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      sellerId: payload.sellerId,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as any,
    }
  );
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      sellerId: payload.sellerId,
      jti: crypto.randomUUID(),
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    }
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
