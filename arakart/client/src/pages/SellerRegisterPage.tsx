import React from 'react';
import { SellerRegisterWizard } from '../components/seller/SellerRegisterWizard';
import { useUiStore } from '../store/uiStore';

export const SellerRegisterPage: React.FC = () => {
  const { language } = useUiStore();

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'hi'
            ? 'अपना व्यवसाय पंजीकृत करें'
            : 'Register Your Business'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          {language === 'hi'
            ? 'हजारों स्थानीय ग्राहकों से सीधे कॉल और व्हाट्सएप पर काम पाएं। कोई कमीशन नहीं।'
            : 'Get direct customer leads via Phone and WhatsApp with zero commission.'}
        </p>
      </div>

      <SellerRegisterWizard />
    </div>
  );
};
