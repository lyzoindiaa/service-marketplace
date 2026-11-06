import api from '../lib/axios';
import { User } from '../types';

export interface AuthApiResponse {
  user: User;
  accessToken: string;
}

export const sendPhoneOtp = async (
  phone: string
): Promise<{ success: boolean; message: string; devCode?: string }> => {
  const res = await api.post('/auth/phone/send-otp', { phone });
  return {
    success: true,
    message: res.data.message || 'OTP sent successfully',
    devCode: res.data.data?.code,
  };
};

export const verifyPhoneOtp = async (
  phone: string,
  code: string,
  name?: string
): Promise<AuthApiResponse> => {
  const res = await api.post('/auth/phone/verify-otp', { phone, code, name });
  return res.data.data;
};

export const registerEmail = async (
  name: string,
  email: string,
  password: string
): Promise<{ user: User; message: string; devCode?: string }> => {
  const res = await api.post('/auth/email/register', { name, email, password });
  return {
    user: res.data.data.user,
    message: res.data.data.message || 'Verification code sent',
    devCode: res.data.data?.code,
  };
};

export const verifyEmail = async (
  email: string,
  code: string
): Promise<AuthApiResponse> => {
  const res = await api.post('/auth/email/verify', { email, code });
  return res.data.data;
};

export const loginEmail = async (
  email: string,
  password: string
): Promise<AuthApiResponse> => {
  const res = await api.post('/auth/email/login', { email, password });
  return res.data.data;
};

export const forgotPassword = async (
  email: string
): Promise<{ message: string; devCode?: string }> => {
  const res = await api.post('/auth/email/forgot-password', { email });
  return {
    message: res.data.data.message,
    devCode: res.data.data?.code,
  };
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> => {
  const res = await api.post('/auth/email/reset-password', { email, code, newPassword });
  return res.data.data;
};

export const loginGoogle = async (idToken: string): Promise<AuthApiResponse> => {
  const res = await api.post('/auth/google', { idToken });
  return res.data.data;
};

export const refreshSession = async (): Promise<{ accessToken: string }> => {
  const res = await api.post('/auth/refresh');
  return res.data.data;
};

export const logoutSession = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const fetchCurrentUser = async (): Promise<{ user: User; provider?: any }> => {
  const res = await api.get('/auth/me');
  return res.data.data;
};
