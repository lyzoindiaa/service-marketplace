import request from 'supertest';
import app from '../../app';
import { setupTestDB } from '../../tests/setup/testSetup';
import { User } from '../../models/User.model';
import { VerificationCode } from '../../models/VerificationCode.model';
import { authService } from '../../services/auth.service';
import { authHeaderFor } from '../../tests/helpers/auth.helper';
import { makeUser } from '../../tests/fixtures';

setupTestDB();

describe('Auth Routes (BE-005)', () => {
  describe('Phone OTP Endpoints', () => {
    it('POST /api/v1/auth/phone/send-otp sends 6-digit code for valid phone', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: '9800012345' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/sent/i);
    });

    it('POST /api/v1/auth/phone/send-otp validates Indian 10-digit format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/v1/auth/phone/verify-otp creates user, returns accessToken and sets refreshToken cookie', async () => {
      // 1. Send OTP
      await request(app)
        .post('/api/v1/auth/phone/send-otp')
        .send({ phone: '9800099887' });

      // In test/dev environment, retrieve the code from DB (or mocked delivery)
      const record = await VerificationCode.findOne({ target: '9800099887' });
      expect(record).not.toBeNull();

      // We use the service to get the actual plain code for testing
      const { code } = await authService.sendPhoneOtp('9800099888');

      const res = await request(app)
        .post('/api/v1/auth/phone/verify-otp')
        .send({
          phone: '9800099888',
          code,
          name: 'Alok Singh',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.phone).toBe('9800099888');
      expect(res.body.data.user.name).toBe('Alok Singh');

      // Verify httpOnly cookie was set
      const rawCookies = res.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies || ''];
      expect(cookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
      expect(cookies.some((c: string) => c.includes('HttpOnly'))).toBe(true);
    });
  });

  describe('Email + Password Endpoints', () => {
    it('executes full email registration, verification, and login cycle', async () => {
      // 1. Register
      const regRes = await request(app)
        .post('/api/v1/auth/email/register')
        .send({
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          password: 'SecurePassword123!',
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.data.user.emailVerified).toBe(false);

      // 2. Login before verification should be rejected
      const earlyLoginRes = await request(app)
        .post('/api/v1/auth/email/login')
        .send({
          email: 'priya.sharma@example.com',
          password: 'SecurePassword123!',
        });
      expect(earlyLoginRes.status).toBe(403);
      expect(earlyLoginRes.body.error).toMatch(/verify your email/i);

      // 3. Verify Email (service-triggered code)
      const { code } = await authService.registerEmail('Priya', 'priya2@example.com', 'SecurePass123!');
      const verifyRes = await request(app)
        .post('/api/v1/auth/email/verify')
        .send({
          email: 'priya2@example.com',
          code,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.user.emailVerified).toBe(true);
      expect(verifyRes.body.data.accessToken).toBeDefined();

      // 4. Successful login
      const loginRes = await request(app)
        .post('/api/v1/auth/email/login')
        .send({
          email: 'priya2@example.com',
          password: 'SecurePass123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
      expect(loginRes.headers['set-cookie']).toBeDefined();

      // 5. Wrong password rejected
      const badLoginRes = await request(app)
        .post('/api/v1/auth/email/login')
        .send({
          email: 'priya2@example.com',
          password: 'WrongPassword!',
        });

      expect(badLoginRes.status).toBe(401);
      expect(badLoginRes.body.success).toBe(false);
    });

    it('POST /api/v1/auth/email/forgot-password and reset-password lifecycle', async () => {
      const { code } = await authService.registerEmail('Karan', 'karan@example.com', 'OldPass123!');
      await authService.verifyEmail('karan@example.com', code);

      const forgotRes = await request(app)
        .post('/api/v1/auth/email/forgot-password')
        .send({ email: 'karan@example.com' });

      expect(forgotRes.status).toBe(200);

      // Register second user for reset flow to test endpoint without cooldown conflict
      const { code: k2Code } = await authService.registerEmail('Karan 2', 'karan2@example.com', 'OldPass123!');
      await authService.verifyEmail('karan2@example.com', k2Code);

      // Get reset code from service
      const { code: resetCode } = await authService.forgotPassword('karan2@example.com');

      const resetRes = await request(app)
        .post('/api/v1/auth/email/reset-password')
        .send({
          email: 'karan2@example.com',
          code: resetCode,
          newPassword: 'BrandNewPassword123!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.data.message).toMatch(/reset successfully/i);
    });
  });

  describe('Session Management & /me Endpoint', () => {
    it('POST /api/v1/auth/refresh rotates refresh cookie and issues new accessToken', async () => {
      const { code } = await authService.sendPhoneOtp('9800011223');
      const auth = await authService.verifyPhoneOtp('9800011223', code);

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${auth.refreshToken}`]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      const rawNewCookies = refreshRes.headers['set-cookie'];
      const newCookies = Array.isArray(rawNewCookies) ? rawNewCookies : [rawNewCookies || ''];
      expect(newCookies.some((c: string) => c.includes('refreshToken='))).toBe(true);
    });

    it('POST /api/v1/auth/logout clears refreshToken cookie', async () => {
      const logoutRes = await request(app).post('/api/v1/auth/logout');

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      const rawCookies = logoutRes.headers['set-cookie'];
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies || ''];
      expect(cookies.some((c: string) => c.includes('refreshToken=;'))).toBe(true);
    });

    it('GET /api/v1/auth/me returns current user profile with valid Bearer token', async () => {
      const user = await makeUser({ name: 'Me Test User', phone: '9800044556', role: 'customer' });
      const authHeaders = authHeaderFor(user);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set(authHeaders);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(user.id);
      expect(res.body.data.user.name).toBe('Me Test User');
    });

    it('GET /api/v1/auth/me rejects request without Bearer token with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
