import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ARA_LOCALITIES = [
  'Nawada',
  'Katira',
  'Babu Bazar',
  'Maula Bagh',
  'Shivganj',
  'Gopali Chowk',
  'Anaith',
  'Jagdeo Nagar',
  'Chandwa',
  'Station Road',
];

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                A
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">
                {t('brand')}
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              {t('tagline')}. Connecting verified mechanics, electricians, plumbers, AC technicians, and drivers directly with customers in Ara, Bhojpur, Bihar.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition-colors">
                  {t('browse')}
                </Link>
              </li>
              <li>
                <Link to="/register-seller" className="hover:text-white transition-colors">
                  {t('becomeSeller')}
                </Link>
              </li>
              <li>
                <Link to="/seller/dashboard" className="hover:text-white transition-colors">
                  Seller Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Help */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Community & Trust
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>Direct Call & WhatsApp (Zero Commission)</li>
              <li>Verified Ara Localities</li>
              <li>Community Ratings & Reviews</li>
              <li>Free for Customers & Service Pros</li>
            </ul>
          </div>
        </div>

        {/* Localities in Ara */}
        <div className="border-t border-slate-800/80 pt-8 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Popular Localities Served in Ara:
          </p>
          <div className="flex flex-wrap gap-2">
            {ARA_LOCALITIES.map((area) => (
              <Link
                key={area}
                to={`/search?area=${encodeURIComponent(area)}`}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AraKart (आराकार्ट). All rights reserved.</p>
          <p>Made with ❤️ for Bhojpur, Bihar</p>
        </div>
      </div>
    </footer>
  );
};
