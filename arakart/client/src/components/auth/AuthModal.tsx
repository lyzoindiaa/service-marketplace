import React, { useState } from 'react';
import { useUiStore } from '../../store/uiStore';
import { Modal } from '../common/Modal';
import { PhoneLoginForm } from './PhoneLoginForm';
import { EmailAuthForm } from './EmailAuthForm';
import { GoogleAuthButton } from './GoogleAuthButton';

export type AuthTab = 'phone' | 'email';

export const AuthModal: React.FC = () => {
  const isOpen = useUiStore((s) => s.authModalOpen);
  const closeModal = useUiStore((s) => s.closeAuthModal);
  const [tab, setTab] = useState<AuthTab>('phone');

  const handleSuccess = () => {
    closeModal();
  };

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title="Sign in to AraKart" maxWidth="md">
      <div className="space-y-5">
        {/* Google OAuth Quick Button */}
        <div>
          <GoogleAuthButton onSuccess={handleSuccess} />
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs font-medium uppercase tracking-wider text-slate-400 absolute">
            or continue with
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('phone')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === 'phone'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Phone OTP
          </button>
          <button
            type="button"
            onClick={() => setTab('email')}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              tab === 'email'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Email & Password
          </button>
        </div>

        {/* Active Form */}
        <div className="pt-1">
          {tab === 'phone' ? (
            <PhoneLoginForm onSuccess={handleSuccess} />
          ) : (
            <EmailAuthForm onSuccess={handleSuccess} />
          )}
        </div>

        {/* Legal Disclaimer */}
        <p className="text-center text-[11px] text-slate-400 pt-2">
          By continuing, you agree to AraKart's{' '}
          <a href="#" className="underline hover:text-slate-600">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-slate-600">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </Modal>
  );
};
