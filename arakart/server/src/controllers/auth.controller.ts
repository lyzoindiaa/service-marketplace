import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { env } from '../config/env';
import { User } from '../models/User.model';
import { Provider } from '../models/Provider.model';

const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
};

export class AuthController {
  // ==========================================
  // Phone OTP
  // ==========================================

  async sendPhoneOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      const result = await authService.sendPhoneOtp(phone);
      sendSuccess(res, result, 'Verification OTP sent successfully');
    } catch (err: any) {
      const status = err.message?.includes('wait') ? 429 : 400;
      sendError(res, err.message || 'Failed to send OTP', status);
    }
  }

  async verifyPhoneOtp(req: Request, res: Response): Promise<void> {
    try {
      const { phone, code, name } = req.body;
      const result = await authService.verifyPhoneOtp(phone, code, name);
      setRefreshTokenCookie(res, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Phone verified successfully'
      );
    } catch (err: any) {
      sendError(res, err.message || 'Verification failed', 400);
    }
  }

  // ==========================================
  // Email + Password
  // ==========================================

  async registerEmail(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, directLogin } = req.body;
      const result = await authService.registerEmail(name, email, password, phone, directLogin);
      if (result.refreshToken) {
        setRefreshTokenCookie(res, result.refreshToken);
      }
      sendSuccess(
        res,
        {
          user: result.user,
          ...(result.accessToken ? { accessToken: result.accessToken } : {}),
          message: result.message,
        },
        result.accessToken ? 'Account created successfully' : 'Registration initiated',
        201
      );
    } catch (err: any) {
      const status =
        err.message?.includes('already exists') || err.message?.includes('already linked')
          ? 409
          : 400;
      sendError(res, err.message || 'Registration failed', status);
    }
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;
      const result = await authService.verifyEmail(email, code);
      setRefreshTokenCookie(res, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Email verified successfully'
      );
    } catch (err: any) {
      sendError(res, err.message || 'Verification failed', 400);
    }
  }

  async loginEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.loginEmail(email, password);
      setRefreshTokenCookie(res, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Login successful'
      );
    } catch (err: any) {
      if (err.message?.includes('verify your email')) {
        sendError(res, err.message, 403);
        return;
      }
      sendError(res, err.message || 'Invalid credentials', 401);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      sendSuccess(res, { message: result.message }, 'Password reset initiated');
    } catch (err: any) {
      const status = err.message?.includes('wait') ? 429 : 400;
      sendError(res, err.message || 'Failed to initiate password reset', status);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;
      const result = await authService.resetPassword(email, code, newPassword);
      sendSuccess(res, { message: result.message }, 'Password reset successful');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to reset password', 400);
    }
  }

  // ==========================================
  // Google OAuth
  // ==========================================

  async loginGoogle(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      const result = await authService.loginWithGoogle(idToken);
      setRefreshTokenCookie(res, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Google login successful'
      );
    } catch (err: any) {
      sendError(res, err.message || 'Google authentication failed', 401);
    }
  }

  // ==========================================
  // Session & /me
  // ==========================================

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        sendError(res, 'Refresh token required in cookie or body', 401);
        return;
      }

      const tokens = await authService.refreshTokens(refreshToken);
      setRefreshTokenCookie(res, tokens.refreshToken);
      sendSuccess(res, { accessToken: tokens.accessToken }, 'Session token refreshed');
    } catch (err: any) {
      clearRefreshTokenCookie(res);
      sendError(res, err.message || 'Session expired. Please log in again.', 401);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await authService.revokeRefreshToken(refreshToken, req.user?.userId);
    clearRefreshTokenCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Authentication required', 401);
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        sendError(res, 'User profile not found', 404);
        return;
      }

      let provider = null;
      if (user.role === 'seller' || req.user.sellerId) {
        provider = await Provider.findOne({ owner: user._id });
      }

      sendSuccess(res, { user, provider }, 'Current user profile');
    } catch (err: any) {
      sendError(res, err.message || 'Failed to retrieve profile', 500);
    }
  }
}

export const authController = new AuthController();
