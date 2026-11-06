import React from 'react';
import { useUiStore } from '../../store/uiStore';
import { Modal } from '../common/Modal';
import { EmailAuthForm } from './EmailAuthForm';

export const AuthModal: React.FC = () => {
  const isOpen = useUiStore((s) => s.authModalOpen);
  const closeModal = useUiStore((s) => s.closeAuthModal);
  const language = useUiStore((s) => s.language);

  const handleSuccess = () => {
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={language === 'hi' ? 'आराकार्ट में साइन इन करें' : 'Sign in to AraKart'}
      maxWidth="md"
    >
      <div className="space-y-4">
        <EmailAuthForm onSuccess={handleSuccess} />

        {/* Legal Disclaimer */}
        <p className="text-center text-[11px] text-slate-400 pt-2">
          {language === 'hi'
            ? 'आगे बढ़कर, आप आराकार्ट की सेवा की शर्तों और गोपनीयता नीति से सहमत होते हैं।'
            : "By continuing, you agree to AraKart's Terms of Service and Privacy Policy."}
        </p>
      </div>
    </Modal>
  );
};
