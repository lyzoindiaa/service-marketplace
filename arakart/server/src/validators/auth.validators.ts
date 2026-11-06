import { z } from 'zod';

// Indian 10-digit mobile number: starts with 6, 7, 8, or 9
export const phoneRegex = /^[6-9]\d{9}$/;

export const sendPhoneOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please provide a valid 10-digit Indian phone number (e.g. 9876543210)'),
});

export const verifyPhoneOtpSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Please provide a valid 10-digit Indian phone number'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain numbers only'),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).optional(),
});

export const registerEmailSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password is too long'),
});

export const verifyEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain numbers only'),
});

export const loginEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain numbers only'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(100, 'Password is too long'),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required'),
});
