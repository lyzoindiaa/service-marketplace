import React, { useState } from 'react';
import {
  loginEmail,
  registerEmail,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CodeInput } from './CodeInput';

export interface EmailAuthFormProps {
  onSuccess: () => void;
}

type Mode = 'login' | 'register' | 'verify-email' | 'forgot' | 'reset-password';

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({ onSuccess }) => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUiStore((s) => s.addToast);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearForm = () => {
    setError(null);
    setCode('');
    setDevCode(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginEmail(email, password);
      setAuth(res.user, res.accessToken);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Login failed';
      if (err.response?.data?.requiresVerification) {
        setDevCode(err.response?.data?.devCode || null);
        setMode('verify-email');
        addToast('Please verify your email to continue', 'info');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields (Name, Email, and Password)');
      return;
    }
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await registerEmail(name.trim(), email.trim(), password, phone.trim() || undefined);
      if (res.accessToken && res.user) {
        setAuth(res.user, res.accessToken);
        addToast(`Account created! Welcome to AraKart, ${res.user.name}.`, 'success');
        onSuccess();
        return;
      }
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setMode('verify-email');
      addToast('Verification code sent to your email', 'info');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyEmail(email, code);
      setAuth(res.user, res.accessToken);
      addToast('Email verified successfully! Welcome to AraKart.', 'success');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await forgotPassword(email);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setMode('reset-password');
      addToast('Password reset code sent to your email', 'info');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the 6-digit reset code');
      return;
    }
    if (password.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email, code, password);
      addToast('Password reset successfully! Please sign in with your new password.', 'success');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      clearForm();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  // --- View: Verify Email ---
  if (mode === 'verify-email') {
    return (
      <form onSubmit={handleVerifyEmail} className="space-y-4">
        {devCode && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div>
              <span className="font-bold">Dev Mode Code: </span>
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-sm">
                {devCode}
              </code>
            </div>
            <button
              type="button"
              onClick={() => setCode(devCode)}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs"
            >
              Auto-fill
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter 6-digit code sent to {email}
          </label>
          <CodeInput value={code} onChange={setCode} disabled={loading} />
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Verify & Continue
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              clearForm();
              setMode('login');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </form>
    );
  }

  // --- View: Forgot Password ---
  if (mode === 'forgot') {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        <p className="text-sm text-slate-600">
          Enter your registered email address and we will send you a 6-digit verification code to
          reset your password.
        </p>

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
        />

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Send Reset Code
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              clearForm();
              setMode('login');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </form>
    );
  }

  // --- View: Reset Password ---
  if (mode === 'reset-password') {
    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        {devCode && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <div>
              <span className="font-bold">Dev Mode Code: </span>
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-sm">
                {devCode}
              </code>
            </div>
            <button
              type="button"
              onClick={() => setCode(devCode)}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs"
            >
              Auto-fill
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            6-Digit Reset Code sent to {email}
          </label>
          <CodeInput value={code} onChange={setCode} disabled={loading} />
        </div>

        <Input
          label="New Password"
          name="newPassword"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          placeholder="Repeat new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Reset Password
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              clearForm();
              setMode('login');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Back to Sign In
          </button>
        </div>
      </form>
    );
  }

  // --- View: Register (Sign Up) ---
  if (mode === 'register') {
    return (
      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          type="text"
          placeholder="e.g. Ramesh Kumar"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="Mobile Number (Optional — for direct service contact)"
          name="phone"
          type="tel"
          placeholder="10-digit mobile number (e.g. 9876543210)"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
          Create Account
        </Button>

        <div className="text-center text-xs text-slate-500 pt-2">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              clearForm();
              setMode('login');
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            Sign In
          </button>
        </div>
      </form>
    );
  }

  // --- View: Login (Sign In) ---
  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <Input
        label="Email Address"
        name="email"
        type="email"
        placeholder="your.email@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError(null);
        }}
        autoFocus
      />

      <div>
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(null);
          }}
        />
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={() => {
              clearForm();
              setMode('forgot');
            }}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Forgot Password?
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
        Sign In
      </Button>

      <div className="text-center text-xs text-slate-500 pt-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => {
            clearForm();
            setMode('register');
          }}
          className="text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Create Account
        </button>
      </div>
    </form>
  );
};
