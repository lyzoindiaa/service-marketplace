import React, { useState, useEffect } from 'react';
import { sendPhoneOtp, verifyPhoneOtp } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CodeInput } from './CodeInput';

export interface PhoneLoginFormProps {
  onSuccess: () => void;
}

export const PhoneLoginForm: React.FC<PhoneLoginFormProps> = ({ onSuccess }) => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUiStore((s) => s.addToast);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await sendPhoneOtp(cleanPhone);
      setStep('otp');
      setCooldown(60);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      addToast('6-digit OTP sent to your phone', 'info');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyPhoneOtp(phone, code, name || undefined);
      setAuth(res.user, res.accessToken);
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Incorrect verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    if (devCode) {
      setCode(devCode);
    }
  };

  if (step === 'phone') {
    return (
      <form onSubmit={handleSendOtp} className="space-y-4">
        <Input
          label="Mobile Number"
          name="phone"
          type="tel"
          placeholder="10-digit mobile number"
          prefix="+91"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
        >
          Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyOtp} className="space-y-4">
      {/* Dev Mode Code Auto-Fill Banner */}
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
            onClick={handleAutoFill}
            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs"
          >
            Auto-fill
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Enter 6-digit OTP sent to +91-{phone.slice(-10)}
        </label>
        <CodeInput value={code} onChange={setCode} disabled={loading} />
      </div>

      <Input
        label="Your Name (Optional)"
        name="name"
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
      >
        Verify & Login
      </Button>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
        <button
          type="button"
          onClick={() => {
            setStep('phone');
            setCode('');
            setError(null);
          }}
          className="text-indigo-600 hover:text-indigo-700 font-semibold"
        >
          Change Number
        </button>

        <button
          type="button"
          disabled={cooldown > 0 || loading}
          onClick={() => handleSendOtp()}
          className="text-indigo-600 hover:text-indigo-700 font-semibold disabled:text-slate-400"
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
        </button>
      </div>
    </form>
  );
};
