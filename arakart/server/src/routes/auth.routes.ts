import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { verifyToken } from '../middleware/auth.middleware';
import {
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  registerEmailSchema,
  verifyEmailSchema,
  loginEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleAuthSchema,
} from '../validators/auth.validators';

const router = Router();

// Phone OTP
router.post('/phone/send-otp', validateBody(sendPhoneOtpSchema), (req, res) =>
  authController.sendPhoneOtp(req, res)
);
router.post('/phone/verify-otp', validateBody(verifyPhoneOtpSchema), (req, res) =>
  authController.verifyPhoneOtp(req, res)
);

// Email + Password
router.post('/email/register', validateBody(registerEmailSchema), (req, res) =>
  authController.registerEmail(req, res)
);
router.post('/email/verify', validateBody(verifyEmailSchema), (req, res) =>
  authController.verifyEmail(req, res)
);
router.post('/email/login', validateBody(loginEmailSchema), (req, res) =>
  authController.loginEmail(req, res)
);
router.post('/email/forgot-password', validateBody(forgotPasswordSchema), (req, res) =>
  authController.forgotPassword(req, res)
);
router.post('/email/reset-password', validateBody(resetPasswordSchema), (req, res) =>
  authController.resetPassword(req, res)
);

// Google OAuth
router.post('/google', validateBody(googleAuthSchema), (req, res) =>
  authController.loginGoogle(req, res)
);

// Session & Profile
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.get('/me', verifyToken, (req, res) => authController.getMe(req, res));

export default router;
