import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const {
    openAuthModal,
    openCityModal,
    selectedCityName,
    selectedCityNameHi,
    selectedStateName,
    selectedStateNameHi,
    setLanguage,
  } = useUiStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isSuperAdmin =
    user?.role === 'admin' ||
    (user?.role as string) === 'superadmin' ||
    (user?.role as string) === 'super_admin';
  const isSeller = user?.role === 'seller';

  const cityDisplay =
    i18n.language === 'hi' ? selectedCityNameHi || selectedCityName : selectedCityName;
  const stateDisplay =
    i18n.language === 'hi' ? selectedStateNameHi || selectedStateName : selectedStateName;

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
    setLanguage(nextLang);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignored: client state is cleared even if network fails
    }
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs transition-shadow duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Logo & City Badge */}
            <div className="flex items-center gap-2 sm:gap-5 min-w-0 shrink-0">
              <Link to="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform shrink-0">
                  A
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                    {t('brand')}
                  </span>
                </div>
              </Link>

              {/* Desktop Interactive City & State Selector */}
              <button
                type="button"
                onClick={openCityModal}
                aria-label="Select city and state"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all whitespace-nowrap shrink-0"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{cityDisplay}</span>
                <span className="text-slate-400 font-medium">, {stateDisplay}</span>
                <span className="text-[10px] text-slate-400">▾</span>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 shrink-0">
              <Link
                to="/"
                className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                  location.pathname === '/'
                    ? 'text-indigo-600 font-bold'
                    : 'text-slate-700 hover:text-indigo-600'
                }`}
              >
                {t('home')}
              </Link>

              {isSuperAdmin ? (
                <>
                  <Link
                    to="/admin"
                    className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                      location.pathname.startsWith('/admin')
                        ? 'text-indigo-600 font-bold'
                        : 'text-slate-700 hover:text-indigo-600'
                    }`}
                  >
                    {t('adminConsole')}
                  </Link>
                  {user?.sellerId && (
                    <Link
                      to="/seller/dashboard"
                      className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                        location.pathname.startsWith('/seller/dashboard')
                          ? 'text-indigo-600 font-bold'
                          : 'text-slate-700 hover:text-indigo-600'
                      }`}
                    >
                      {t('sellerDashboard')}
                    </Link>
                  )}
                </>
              ) : isSeller ? (
                <>
                  <Link
                    to="/seller/dashboard"
                    className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                      location.pathname.startsWith('/seller/dashboard')
                        ? 'text-indigo-600 font-bold'
                        : 'text-slate-700 hover:text-indigo-600'
                    }`}
                  >
                    {t('sellerDashboard')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/search"
                    className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                      location.pathname === '/search'
                        ? 'text-indigo-600 font-bold'
                        : 'text-slate-700 hover:text-indigo-600'
                    }`}
                  >
                    {t('browse')}
                  </Link>
                  <Link
                    to="/offers"
                    className={`text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${
                      location.pathname === '/offers'
                        ? 'text-indigo-600 font-bold'
                        : 'text-slate-700 hover:text-indigo-600'
                    }`}
                  >
                    <span>🔥</span>
                    <span>{i18n.language === 'hi' ? 'ऑफ़र' : 'Offers'}</span>
                  </Link>
                  <Link
                    to="/blogs"
                    className={`text-sm font-semibold transition-colors whitespace-nowrap ${
                      location.pathname.startsWith('/blogs')
                        ? 'text-indigo-600 font-bold'
                        : 'text-slate-700 hover:text-indigo-600'
                    }`}
                  >
                    {i18n.language === 'hi' ? 'ब्लॉग' : 'Blogs'}
                  </Link>
                  {!user && (
                    <Link
                      to="/register-seller"
                      className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>{t('becomeSeller')}</span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-100 text-amber-800">
                        Free
                      </span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Language Switch Toggle */}
              <button
                onClick={toggleLanguage}
                aria-label="Switch language"
                className="h-[42px] px-3 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1 whitespace-nowrap shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <span className="text-xs sm:text-sm">🌐</span>
                <span className="sm:hidden">{i18n.language === 'en' ? 'हिं' : 'EN'}</span>
                <span className="hidden sm:inline">{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
              </button>

              {/* User Profile Chip or Login Button */}
              {user ? (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm border border-indigo-200 shrink-0">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline-block text-sm font-semibold text-slate-800 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <svg
                      className="w-4 h-4 text-slate-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.phone || user.email}</p>
                      </div>

                      {user.role === 'customer' && (
                        <Link
                          to="/favourites"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                          {t('savedProviders', 'Saved Providers')}
                        </Link>
                      )}

                      {isSeller && (
                        <>
                          <Link
                            to="/seller/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            {t('sellerDashboard')}
                          </Link>
                          <Link
                            to="/seller/dashboard?tab=profile"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                          >
                            {i18n.language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : 'Edit Profile'}
                          </Link>
                        </>
                      )}

                      {isSuperAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                          {t('adminConsole')}
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={openAuthModal}
                  aria-label="Login"
                  className="whitespace-nowrap shrink-0"
                >
                  <span className="sm:hidden">{i18n.language === 'en' ? 'Login' : 'लॉग इन'}</span>
                  <span className="hidden sm:inline">{t('login')}</span>
                </Button>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Open mobile menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-100 py-3 space-y-1.5">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-base font-semibold ${
                  location.pathname === '/'
                    ? 'bg-indigo-50 text-indigo-600 font-bold'
                    : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {t('home')}
              </Link>

              {isSuperAdmin ? (
                <>
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-xl text-base font-semibold ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    ⚡ {t('adminConsole')}
                  </Link>
                  {user?.sellerId && (
                    <Link
                      to="/seller/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-3 py-2 rounded-xl text-base font-semibold ${
                        location.pathname.startsWith('/seller/dashboard')
                          ? 'bg-indigo-50 text-indigo-600 font-bold'
                          : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      🏪 {t('sellerDashboard')}
                    </Link>
                  )}
                </>
              ) : isSeller ? (
                <>
                  <Link
                    to="/seller/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-xl text-base font-semibold ${
                      location.pathname.startsWith('/seller/dashboard')
                        ? 'bg-indigo-50 text-indigo-600 font-bold'
                        : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    🏪 {t('sellerDashboard')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    {t('browse')}
                  </Link>
                  <Link
                    to="/offers"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    🔥 {i18n.language === 'hi' ? 'सेवा ऑफ़र' : 'Service Offers'}
                  </Link>
                  <Link
                    to="/blogs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    📰 {i18n.language === 'hi' ? 'ब्लॉग और गाइड' : 'Blogs & Guides'}
                  </Link>
                  {!user && (
                    <Link
                      to="/register-seller"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {t('becomeSeller')}
                    </Link>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Location Sub-bar Strip (< 640px) — Zero Overflow */}
        <div className="sm:hidden bg-slate-50 border-t border-slate-100 px-4 py-1.5">
          <button
            type="button"
            onClick={openCityModal}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500 shrink-0" />
              <span className="truncate">
                {i18n.language === 'hi' ? 'स्थान:' : 'Serving:'} {cityDisplay}, {stateDisplay}
              </span>
            </span>
            <span className="text-indigo-600 font-bold shrink-0 ml-2">
              {i18n.language === 'hi' ? 'बदलें ▾' : 'Change ▾'}
            </span>
          </button>
        </div>
      </header>
      {/* Spacer matching fixed header height so content never hides behind it */}
      <div className="h-[93px] sm:h-20 w-full shrink-0" aria-hidden="true" />
    </>
  );
};
