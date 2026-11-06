import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User.model';
import { Provider } from '../models/Provider.model';
import { verificationService } from './verification.service';
import { hashPassword, comparePassword } from '../utils/password.utils';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  JwtPayload,
} from '../utils/jwt.utils';
import { env } from '../config/env';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private googleClient: OAuth2Client | null = null;

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    }
    return this.googleClient;
  }

  /**
   * Helper to generate Access and Refresh tokens with sellerId if provider exists
   */
  async generateTokensForUser(user: IUser): Promise<AuthTokens> {
    const provider = await Provider.findOne({ owner: user._id });
    const payload: JwtPayload = {
      userId: user._id.toString(),
      role: user.role,
      sellerId: provider ? provider._id.toString() : null,
    };

    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
    };
  }

  // ==========================================
  // 1. Phone OTP Auth
  // ==========================================

  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string; code: string; cooldownSeconds: number }> {
    return verificationService.sendCode('phone', phone, 'login');
  }

  async verifyPhoneOtp(phone: string, code: string, name?: string): Promise<AuthResponse> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    await verificationService.verifyCode('phone', cleanPhone, 'login', code);

    let user = await User.findOne({ phone: cleanPhone });

    if (!user) {
      // First-time signup via Phone OTP
      user = await User.create({
        phone: cleanPhone,
        name: name || `User ${cleanPhone.slice(-4)}`,
        role: 'customer',
        phoneVerified: true,
        emailVerified: false,
        authMethods: ['phone'],
      });
    } else {
      if (user.suspended) {
        throw new Error('This account has been suspended. Please contact support.');
      }
      if (!user.phoneVerified) {
        user.phoneVerified = true;
      }
      if (!user.authMethods.includes('phone')) {
        user.authMethods.push('phone');
      }
      if (name && (!user.name || user.name.startsWith('User '))) {
        user.name = name;
      }
      await user.save();
    }

    const tokens = await this.generateTokensForUser(user);
    return {
      user,
      ...tokens,
    };
  }

  // ==========================================
  // 2. Email + Password Auth
  // ==========================================

  async registerEmail(
    name: string,
    email: string,
    password: string
  ): Promise<{ user: IUser; code: string; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: cleanEmail });

    if (existing && existing.emailVerified) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const passwordHash = await hashPassword(password);
    let user: IUser;

    if (existing && !existing.emailVerified) {
      existing.name = name;
      existing.passwordHash = passwordHash;
      if (!existing.authMethods.includes('email')) {
        existing.authMethods.push('email');
      }
      await existing.save();
      user = existing;
    } else {
      user = await User.create({
        name,
        email: cleanEmail,
        passwordHash,
        role: 'customer',
        emailVerified: false,
        phoneVerified: false,
        authMethods: ['email'],
      });
    }

    const { code } = await verificationService.sendCode('email', cleanEmail, 'verify_email');
    return {
      user,
      code,
      message: 'Registration initiated. Verification code sent to your email.',
    };
  }

  async verifyEmail(email: string, code: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    await verificationService.verifyCode('email', cleanEmail, 'verify_email', code);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw new Error('User not found.');
    }

    if (user.suspended) {
      throw new Error('This account has been suspended. Please contact support.');
    }

    user.emailVerified = true;
    await user.save();

    const tokens = await this.generateTokensForUser(user);
    return {
      user,
      ...tokens,
    };
  }

  async loginEmail(email: string, password: string): Promise<AuthResponse> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    if (user.suspended) {
      throw new Error('This account has been suspended. Please contact support.');
    }

    if (!user.passwordHash) {
      throw new Error('This account was created with Google or Phone. Please use the appropriate login method.');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password.');
    }

    if (!user.emailVerified) {
      // Re-send verification code if user attempts login while unverified and cooldown elapsed
      try {
        await verificationService.sendCode('email', cleanEmail, 'verify_email');
      } catch {
        // Cooldown in effect; existing code is still valid
      }
      throw new Error('Please verify your email address before logging in. A verification code has been sent to your email.');
    }

    const tokens = await this.generateTokensForUser(user);
    return {
      user,
      ...tokens,
    };
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; code: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Security practice: don't reveal email existence to prevent enumeration
      return {
        success: true,
        message: 'If an account exists with this email, a reset code has been sent.',
        code: '',
      };
    }

    const { code } = await verificationService.sendCode('email', cleanEmail, 'reset_password');
    return {
      success: true,
      message: 'Password reset code sent to your email.',
      code,
    };
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    await verificationService.verifyCode('email', cleanEmail, 'reset_password', code);

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      throw new Error('User not found.');
    }

    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.emailVerified = true;
    if (!user.authMethods.includes('email')) {
      user.authMethods.push('email');
    }
    await user.save();

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }

  // ==========================================
  // 3. Google OAuth & Account Linking
  // ==========================================

  async processGoogleUser(payload: {
    sub: string;
    email: string;
    name?: string;
    picture?: string;
  }): Promise<AuthResponse> {
    const cleanEmail = payload.email.trim().toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      // Check if user already exists with matching verified email
      const existingEmailUser = await User.findOne({ email: cleanEmail });

      if (existingEmailUser) {
        // Auto-link Google login
        existingEmailUser.googleId = payload.sub;
        existingEmailUser.emailVerified = true;
        if (!existingEmailUser.authMethods.includes('google')) {
          existingEmailUser.authMethods.push('google');
        }
        if (!existingEmailUser.avatarUrl && payload.picture) {
          existingEmailUser.avatarUrl = payload.picture;
        }
        await existingEmailUser.save();
        user = existingEmailUser;
      } else {
        // Create new user via Google
        user = await User.create({
          googleId: payload.sub,
          email: cleanEmail,
          name: payload.name || 'User',
          avatarUrl: payload.picture,
          emailVerified: true,
          phoneVerified: false,
          role: 'customer',
          authMethods: ['google'],
        });
      }
    }

    if (user.suspended) {
      throw new Error('This account has been suspended. Please contact support.');
    }

    const tokens = await this.generateTokensForUser(user);
    return {
      user,
      ...tokens,
    };
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const client = this.getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new Error('Invalid Google authentication response.');
    }

    return this.processGoogleUser({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
  }

  // ==========================================
  // 4. Session & Token Refresh
  // ==========================================

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    if (!refreshToken) {
      throw new Error('Refresh token is required.');
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.suspended) {
      throw new Error('Account suspended.');
    }

    return this.generateTokensForUser(user);
  }
}

export const authService = new AuthService();
