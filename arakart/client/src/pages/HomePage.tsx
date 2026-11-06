import React from 'react';
import { useTranslation } from 'react-i18next';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <section className="bg-hero-radial text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6">
            ✨ Hyperlocal Services Platform — Ara, Bihar
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('heroH')} <span className="text-accent">Ara</span>
          </h1>
          <p className="mt-4 text-slate-300 text-lg max-w-2xl mx-auto">
            {t('heroP')}
          </p>
        </div>
      </section>
    </div>
  );
};
