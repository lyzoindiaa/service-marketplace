import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  PhoneCall,
  Search,
  Star,
  MessageSquareQuote,
} from 'lucide-react';
import { SearchBar } from '../components/search/SearchBar';
import { CategoryGrid } from '../components/search/CategoryGrid';
import { fetchCityAreas } from '../services/discoveryService';
import { fetchPublicStats, PublicStatsResponse } from '../services/providerService';
import { useUiStore } from '../store/uiStore';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    selectedCity,
    selectedCityName,
    selectedCityNameHi,
    language,
  } = useUiStore();
  const [areas, setAreas] = useState<string[]>([]);
  const [publicStats, setPublicStats] = useState<PublicStatsResponse>({
    verifiedProvidersCount: 0,
    categoriesCount: 0,
    avgRating: 0,
    totalReviews: 0,
    recentReviews: [],
  });

  const isSpecificCity = Boolean(selectedCity && selectedCity !== 'all');
  const cityLabel =
    language === 'hi' ? selectedCityNameHi || selectedCityName : selectedCityName;

  useEffect(() => {
    let isMounted = true;
    fetchCityAreas(selectedCity || 'all')
      .then((data) => {
        if (isMounted && data?.areas) {
          setAreas(data.areas.slice(0, 8));
        }
      })
      .catch(() => {});

    fetchPublicStats(selectedCity || 'all')
      .then((stats) => {
        if (isMounted && stats) {
          setPublicStats(stats);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 1. Hero Section */}
      <section className="bg-hero-radial text-white min-h-[480px] sm:min-h-[540px] lg:min-h-[600px] flex items-center justify-center py-20 sm:py-28 lg:py-36 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-4xl w-full mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-7 shadow-sm backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>
              {isSpecificCity
                ? `Hyperlocal Services Platform — ${cityLabel}`
                : 'Hyperlocal Services Platform'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            {t('heroH')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">
              {isSpecificCity
                ? `in ${cityLabel}`
                : language === 'hi'
                ? 'आपके शहर में'
                : 'Near You'}
            </span>
          </h1>

          <p className="mt-5 text-slate-200 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {t('heroP')}
          </p>

          {/* Search Bar */}
          <div className="mt-10">
            <SearchBar />
          </div>

          {/* Locality Quick Chips */}
          {areas.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-300" /> Popular Localities:
              </span>
              {areas.map((areaName) => (
                <button
                  key={areaName}
                  type="button"
                  onClick={() => navigate(`/search?area=${encodeURIComponent(areaName)}`)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-xs font-medium text-white transition-all backdrop-blur-sm active:scale-95"
                >
                  {areaName}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Dynamic Stats Banner */}
      <section className="bg-white border-b border-slate-200/70 py-6 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {publicStats.verifiedProvidersCount}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'सत्यापित सेवा प्रदाता (Verified Service Providers)' : 'Verified Service Providers'}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {publicStats.categoriesCount}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'सेवा श्रेणियाँ (Service Categories)' : 'Service Categories'}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">100%</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {language === 'hi' ? 'सीधा संपर्क (0% शुल्क)' : 'Direct Contact (0% Fee)'}
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {publicStats.avgRating > 0 ? `${publicStats.avgRating} ★` : 'New ★'}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {publicStats.totalReviews > 0
                ? `Customer Rating (${publicStats.totalReviews} Reviews)`
                : 'Average Customer Rating'}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Grid Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mb-8 gap-3 text-center sm:text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Popular Services
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Find verified local professionals by trade
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1 group self-center sm:self-auto"
          >
            <span>View All Providers</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <CategoryGrid />
      </section>

      {/* 3b. Dynamic Recent Customer Reviews Section */}
      {publicStats.recentReviews.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <div className="text-center sm:text-left mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold mb-2">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ग्राहकों की राय' : 'Verified Customer Reviews'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {language === 'hi' ? 'ग्राहक क्या कह रहे हैं' : 'What Customers Are Saying'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicStats.recentReviews.slice(0, 3).map((rev) => (
              <div
                key={rev.id}
                onClick={() => rev.providerId && navigate(`/providers/${rev.providerId}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-slate-900">{rev.customerName}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    "{rev.comment}"
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600 truncate">
                    {language === 'hi'
                      ? rev.providerNameHi || rev.providerNameEn
                      : rev.providerNameEn}
                  </span>
                  {rev.providerArea && (
                    <span className="text-slate-400 shrink-0 ml-2">{rev.providerArea}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. How It Works Section */}
      <section className="bg-slate-100/70 border-y border-slate-200/60 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              How AraKart Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Connecting residents directly to vetted neighborhood service professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">1. Find & Filter</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Choose the service you need and narrow results to your specific city and locality.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">2. Compare Transparent Prices</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Review verified profiles, transparent starting rates, working hours, and genuine
                ratings from local customers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PhoneCall className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">3. Connect Instantly</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Call or WhatsApp verified professionals directly. Zero platform commissions, zero
                hidden booking charges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Provider / Seller CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" /> For Service Professionals & Technicians
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grow Your Business with AraKart
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Join top-rated electricians, plumbers, and home experts receiving direct
              customer calls every day.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/register-seller')}
              className="w-full md:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-2xl shadow-lg transition-all text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <span>Register as a Service Professional</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
