import { setupTestDB } from '../../tests/setup/testSetup';
import { authService } from '../auth.service';
import { verificationService } from '../verification.service';
import { User } from '../../models/User.model';
import { VerificationCode } from '../../models/VerificationCode.model';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { generateCode, hashCode, verifyCodeHash } from '../../utils/code.utils';
import { verifyAccessToken, verifyRefreshToken } from '../../utils/jwt.utils';

setupTestDB();

describe('Multi-Channel Auth & Verification Service (BE-004)', () => {
  describe('Crypto & Code Utilities', () => {
    it('generates 6-digit numeric codes and securely verifies bcrypt hashes', async () => {
      const code = generateCode();
      expect(code).toMatch(/^\d{6}$/);

      const hash = await hashCode(code);
      expect(hash).not.toBe(code);

      const isValid = await verifyCodeHash(code, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyCodeHash('000000', hash);
      expect(isInvalid).toBe(false);
    });

    it('hashes passwords with bcrypt cost 12 and verifies correctly', async () => {
      const plain = 'SecurePassword123!';
      const hash = await hashPassword(plain);

      expect(hash).not.toBe(plain);
      // Cost 12 produces $2a$12$ or $2b$12$ prefix
      expect(hash.startsWith('$2a$12$') || hash.startsWith('$2b$12$')).toBe(true);

      const matches = await comparePassword(plain, hash);
      expect(matches).toBe(true);

      const mismatches = await comparePassword('WrongPassword', hash);
      expect(mismatches).toBe(false);
    });
  });

  describe('Verification Service', () => {
    it('creates verification record with hash, enforces expiry and limits attempts', async () => {
      const { code } = await verificationService.sendCode('phone', '9800011122', 'login');
      expect(code).toMatch(/^\d{6}$/);

      // Verify record is hashed in DB, plaintext not stored
      const record = await VerificationCode.findOne({ target: '9800011122' });
      expect(record).not.toBeNull();
      expect(record?.codeHash).not.toBe(code);
      expect(record?.codeHash).toMatch(/^\$2[ab]\$/);

      // Cooldown enforcement: requesting immediately throws error
      await expect(
        verificationService.sendCode('phone', '9800011122', 'login')
      ).rejects.toThrow(/wait/i);

      // Wrong code increments attempts
      await expect(
        verificationService.verifyCode('phone', '9800011122', 'login', '000000')
      ).rejects.toThrow(/incorrect/i);

      const updatedRecord = await VerificationCode.findOne({ target: '9800011122' });
      expect(updatedRecord?.attempts).toBe(1);

      // Correct code succeeds and deletes the verification record
      const verified = await verificationService.verifyCode('phone', '9800011122', 'login', code);
      expect(verified).toBe(true);

      const deletedRecord = await VerificationCode.findOne({ target: '9800011122' });
      expect(deletedRecord).toBeNull();
    });
  });

  describe('Phone OTP Authentication', () => {
    it('creates a new customer user on first OTP login', async () => {
      const { code } = await authService.sendPhoneOtp('9800033344');
      const result = await authService.verifyPhoneOtp('9800033344', code, 'Ramesh Kumar');

      expect(result.user).toBeDefined();
      expect(result.user.phone).toBe('9800033344');
      expect(result.user.name).toBe('Ramesh Kumar');
      expect(result.user.role).toBe('customer');
      expect(result.user.phoneVerified).toBe(true);
      expect(result.user.authMethods).toContain('phone');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      const decodedAccess = verifyAccessToken(result.accessToken);
      expect(decodedAccess.userId).toBe(result.user.id);
      expect(decodedAccess.role).toBe('customer');
    });

    it('logs into existing user on subsequent OTP login without creating duplicates', async () => {
      // First login
      const { code: code1 } = await authService.sendPhoneOtp('9800055566');
      await authService.verifyPhoneOtp('9800055566', code1, 'Sunita Devi');

      // Second login
      const { code: code2 } = await authService.sendPhoneOtp('9800055566');
      const result2 = await authService.verifyPhoneOtp('9800055566', code2);

      const users = await User.find({ phone: '9800055566' });
      expect(users.length).toBe(1);
      expect(result2.user.name).toBe('Sunita Devi');
    });
  });

  describe('Email + Password Lifecycle', () => {
    it('registers unverified user, sends code, verifies email, and enables login', async () => {
      // 1. Register
      const { user: regUser, code } = await authService.registerEmail(
        'Anil Sharma',
        'anil.sharma@example.com',
        'Password123!'
      );
      expect(regUser.emailVerified).toBe(false);

      // Attempting login before verification fails
      await expect(
        authService.loginEmail('anil.sharma@example.com', 'Password123!')
      ).rejects.toThrow(/verify your email/i);

      // 2. Verify Email
      const verifyResult = await authService.verifyEmail('anil.sharma@example.com', code);
      expect(verifyResult.user.emailVerified).toBe(true);
      expect(verifyResult.accessToken).toBeDefined();

      // 3. Login with correct password
      const loginResult = await authService.loginEmail('anil.sharma@example.com', 'Password123!');
      expect(loginResult.user.email).toBe('anil.sharma@example.com');
      expect(loginResult.accessToken).toBeDefined();

      // 4. Login with wrong password fails
      await expect(
        authService.loginEmail('anil.sharma@example.com', 'WrongPassword!')
      ).rejects.toThrow(/invalid email or password/i);
    });

    it('handles forgot password and reset password flow', async () => {
      // Register and verify
      const { code } = await authService.registerEmail('Vikas', 'vikas@example.com', 'OldPass123!');
      await authService.verifyEmail('vikas@example.com', code);

      // Forgot password requests code
      const { code: resetCode } = await authService.forgotPassword('vikas@example.com');
      expect(resetCode).toMatch(/^\d{6}$/);

      // Reset password with code
      await authService.resetPassword('vikas@example.com', resetCode, 'NewPass123!');

      // Old password should fail, new should succeed
      await expect(
        authService.loginEmail('vikas@example.com', 'OldPass123!')
      ).rejects.toThrow(/invalid email or password/i);

      const successLogin = await authService.loginEmail('vikas@example.com', 'NewPass123!');
      expect(successLogin.user.email).toBe('vikas@example.com');
    });
  });

  describe('Google OAuth & Account Linking', () => {
    it('auto-links Google sign-in to existing verified email account', async () => {
      // Create verified email user
      const { code } = await authService.registerEmail('Pooja', 'pooja@example.com', 'Password123!');
      await authService.verifyEmail('pooja@example.com', code);

      // Mock Google idToken verification payload
      const mockGooglePayload = {
        sub: 'google-sub-id-12345',
        email: 'pooja@example.com',
        name: 'Pooja Verma',
        picture: 'https://example.com/pooja.jpg',
      };

      const result = await authService.processGoogleUser(mockGooglePayload);
      expect(result.user.googleId).toBe('google-sub-id-12345');
      expect(result.user.authMethods).toContain('google');
      expect(result.user.authMethods).toContain('email');

      const userCount = await User.countDocuments({ email: 'pooja@example.com' });
      expect(userCount).toBe(1);
    });

    it('creates new user on first Google sign-in if no email exists', async () => {
      const mockGooglePayload = {
        sub: 'google-sub-id-99999',
        email: 'newuser@example.com',
        name: 'New Google User',
        picture: 'https://example.com/avatar.jpg',
      };

      const result = await authService.processGoogleUser(mockGooglePayload);
      expect(result.user.email).toBe('newuser@example.com');
      expect(result.user.googleId).toBe('google-sub-id-99999');
      expect(result.user.emailVerified).toBe(true);
      expect(result.user.authMethods).toContain('google');
    });
  });

  describe('Session Management', () => {
    it('rotates refresh token and generates fresh access token', async () => {
      const { code } = await authService.sendPhoneOtp('9800077788');
      const { refreshToken, user } = await authService.verifyPhoneOtp('9800077788', code);

      const refreshed = await authService.refreshTokens(refreshToken);
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();
      expect(refreshed.refreshToken).not.toBe(refreshToken);

      const decoded = verifyRefreshToken(refreshed.refreshToken);
      expect(decoded.userId).toBe(user.id);
    });
  });
});
