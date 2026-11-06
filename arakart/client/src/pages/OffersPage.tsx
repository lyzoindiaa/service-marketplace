import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag,
  Clock,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  Phone,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import {
  fetchPublicOffers,
  fetchMyAppliedOffers,
  applyOffer,
  OfferItem,
  AppliedOfferItem,
} from '../services/offerService';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const OffersPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, selectedCity, openAuthModal, addToast } = useUiStore();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'browse' | 'my_applied'>('browse');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'date_range' | 'single_day_slot'>('all');
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [myAppliedOffers, setMyAppliedOffers] = useState<AppliedOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [claimedModalData, setClaimedModalData] = useState<{
    claimCode: string;
    serviceTitleEn: string;
    offerPrice: number;
    originalPrice: number;
    sellerName: string;
    sellerPhone: string;
    sellerArea: string;
  } | null>(null);

  const loadOffersData = useCallback(async () => {
    try {
      setLoading(true);
      const publicList = await fetchPublicOffers({
        city: selectedCity,
        scheduleType: scheduleFilter !== 'all' ? scheduleFilter : undefined,
      });
      setOffers(publicList);

      if (isAuthenticated) {
        const appliedList = await fetchMyAppliedOffers();
        setMyAppliedOffers(appliedList);
      } else {
        setMyAppliedOffers([]);
      }
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCity, scheduleFilter, isAuthenticated]);

  useEffect(() => {
    loadOffersData();
  }, [loadOffersData]);

  const handleApplyOffer = async (offer: OfferItem) => {
    if (!isAuthenticated) {
      addToast(
        language === 'hi'
          ? 'ऑफर लागू करने के लिए कृपया लॉगिन करें'
          : 'Please sign in to apply this service offer',
        'info'
      );
      openAuthModal();
      return;
    }

    try {
      setApplyingId(offer.id);
      const res = await applyOffer(offer.id);
      setClaimedModalData({
        claimCode: res.application.claimCode,
        serviceTitleEn: res.application.serviceTitleEn,
        offerPrice: res.application.offerPrice,
        originalPrice: res.application.originalPrice,
        sellerName: res.application.sellerName,
        sellerPhone: res.application.sellerPhone,
        sellerArea: res.application.sellerArea,
      });
      addToast(
        res.alreadyApplied
          ? 'You have already applied this offer! Showing your claim code.'
          : 'Offer applied! Seller has been notified.',
        'success'
      );
      await loadOffersData();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to apply offer', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-10 text-white mb-8 shadow-sm">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'hi' ? 'विशेष सेवा ऑफ़र' : 'Special Service Deals'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {language === 'hi'
              ? 'सीमित समय और कार्य-घंटे के सर्विस ऑफ़र'
              : 'Time-Window & Work-Hour Service Offers'}
          </h1>
          <p className="text-white/90 text-sm sm:text-base">
            {language === 'hi'
              ? 'सत्यापित विक्रेताओं द्वारा विशेष तिथि सीमा या किसी विशेष दिन के घंटे के लिए दिए गए ऑफ़र लागू करें और तुरंत कूपन कोड प्राप्त करें।'
              : 'Apply verified seller discounts scheduled for specific date ranges & working hours or single-day flash hour slots.'}
          </p>
        </div>
      </div>

      {/* Main Mode Tabs: Browse Offers vs My Applied Offers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            {language === 'hi' ? 'उपलब्ध ऑफ़र' : 'Available Offers'} ({offers.length})
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal();
                return;
              }
              setActiveTab('my_applied');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'my_applied'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Ticket className="w-4 h-4" />
            {language === 'hi' ? 'मेरे लागू किए गए ऑफ़र' : 'My Applied Offers'} (
            {myAppliedOffers.length})
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setScheduleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                scheduleFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'hi' ? 'सभी ऑफ़र' : 'All Schedules'}
            </button>
            <button
              onClick={() => setScheduleFilter('date_range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                scheduleFilter === 'date_range'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📅 {language === 'hi' ? 'तिथि सीमा + कार्य घंटे' : 'Date Range + Work Hours'}
            </button>
            <button
              onClick={() => setScheduleFilter('single_day_slot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                scheduleFilter === 'single_day_slot'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⚡ {language === 'hi' ? 'एकल दिन विशेष घंटा' : 'Single-Day Hour Slot'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : activeTab === 'browse' ? (
        offers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {language === 'hi'
                ? 'अभी कोई सक्रिय ऑफ़र नहीं है'
                : 'No Active Service Offers Found'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {language === 'hi'
                ? 'जब विक्रेता अपनी किसी सेवा पर तिथि सीमा या विशेष घंटे का ऑफ़र लगाएंगे, तो वह यहाँ दिखाई देगा।'
                : 'When sellers apply a Date-Range Work-Hours offer or Single-Day Hour-Slot deal on their services, it will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const title = language === 'hi' && offer.titleHi ? offer.titleHi : offer.titleEn;
              const serviceTitle =
                language === 'hi' && offer.serviceTitleHi
                  ? offer.serviceTitleHi
                  : offer.serviceTitleEn;
              const sellerName =
                language === 'hi' && offer.seller?.nameHi
                  ? offer.seller.nameHi
                  : offer.seller?.nameEn || 'Verified Provider';

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5">
                    {/* Top Status & Discount Ribbon */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                        🔥 {offer.discountPercent}% OFF
                      </span>

                      <Badge
                        variant={offer.computedStatus === 'live_now' ? 'success' : 'pending'}
                      >
                        {offer.computedStatus === 'live_now'
                          ? language === 'hi'
                            ? '● अभी लाइव'
                            : '● Live Now'
                          : language === 'hi'
                          ? '⏳ आगामी स्लॉट'
                          : '⏳ Upcoming Window'}
                      </Badge>
                    </div>

                    {/* Offer Title & Specific Service Badge */}
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">{title}</h3>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-xs font-semibold mb-3">
                      🛠️ {language === 'hi' ? 'सेवा:' : 'Service:'} {serviceTitle}
                    </div>

                    {offer.descriptionEn && (
                      <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                        {language === 'hi' && offer.descriptionHi
                          ? offer.descriptionHi
                          : offer.descriptionEn}
                      </p>
                    )}

                    {/* Price Comparison Box */}
                    <div className="flex items-baseline gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                      <div>
                        <span className="text-[11px] text-slate-400 block">
                          {language === 'hi' ? 'ऑफ़र मूल्य' : 'Offer Price'}
                        </span>
                        <span className="text-2xl font-extrabold text-emerald-600">
                          ₹{offer.offerPrice}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 line-through">
                        ₹{offer.originalPrice}
                      </div>
                      <div className="ml-auto text-right">
                        <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          Save ₹{offer.originalPrice - offer.offerPrice}
                        </span>
                      </div>
                    </div>

                    {/* Schedule Details (Date Range + Work Hours OR Single Day + Hour Slot) */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-amber-50/60 border border-amber-200/60 rounded-xl p-3 mb-4">
                      {offer.scheduleType === 'date_range' ? (
                        <>
                          <div className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Date Range: {offer.startDate} to {offer.endDate}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Work Hours: {offer.workHoursStart} – {offer.workHoursEnd}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span>Single Day Deal: {offer.singleDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Particular Hour Slot: {offer.slotStartHour} – {offer.slotEndHour}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Seller Info */}
                    {offer.seller && (
                      <div
                        onClick={() => navigate(`/provider/${offer.seller?.id}`)}
                        className="flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer hover:opacity-80"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            {sellerName}
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {offer.seller.area}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-amber-600">
                          ★ {offer.seller.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100">
                    <Button
                      fullWidth
                      size="sm"
                      isLoading={applyingId === offer.id}
                      onClick={() => handleApplyOffer(offer)}
                    >
                      {offer.hasCustomerApplied
                        ? language === 'hi'
                          ? '✓ लागू किया गया (कूपन देखें)'
                          : '✓ Applied (View Claim Code)'
                        : language === 'hi'
                        ? 'ऑफ़र लागू करें (Apply Offer)'
                        : 'Apply Offer on Service'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* My Applied Offers Tab (Customer View) */
        <div>
          {myAppliedOffers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {language === 'hi'
                  ? 'आपने अभी तक कोई ऑफ़र लागू नहीं किया है'
                  : 'You Have Not Applied Any Offers Yet'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-5">
                {language === 'hi'
                  ? 'उपलब्ध ऑफ़र टैब से किसी सेवा पर ऑफ़र लागू करें और यहाँ अपना विवरण देखें।'
                  : 'Browse available service deals and click "Apply Offer" to track which offers you applied on which service.'}
              </p>
              <Button size="sm" onClick={() => setActiveTab('browse')}>
                {language === 'hi' ? 'उपलब्ध ऑफ़र देखें' : 'Browse Available Offers'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myAppliedOffers.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Coupon: {item.claimCode}
                      </span>
                      <span className="text-xs text-slate-400">
                        Applied on{' '}
                        {new Date(item.appliedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mb-1">
                      {item.offer?.titleEn || 'Special Service Offer'}
                    </h3>
                    <p className="text-xs font-semibold text-brand-primary mb-3">
                      🛠️ Applied on Service: {item.serviceTitleEn}
                    </p>

                    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-3">
                      <div>
                        <span className="text-slate-400 block">Discounted Price</span>
                        <span className="text-lg font-extrabold text-emerald-600">
                          ₹{item.offerPrice}
                        </span>{' '}
                        <span className="text-slate-400 line-through">₹{item.originalPrice}</span>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="success">{item.discountPercent}% OFF</Badge>
                      </div>
                    </div>

                    {item.offer && (
                      <div className="text-xs text-slate-600 mb-3">
                        {item.offer.scheduleType === 'date_range' ? (
                          <span>
                            📅 Valid {item.offer.startDate} to {item.offer.endDate} (Work Hours:{' '}
                            {item.offer.workHoursStart}–{item.offer.workHoursEnd})
                          </span>
                        ) : (
                          <span>
                            ⚡ Valid on {item.offer.singleDate} (Hour Slot:{' '}
                            {item.offer.slotStartHour}–{item.offer.slotEndHour})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {item.seller && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Seller: {item.seller.nameEn}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.seller.area}</div>
                      </div>
                      {item.seller.phone && (
                        <a
                          href={`tel:${item.seller.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-brand-primary/90"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {item.seller.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claimed Offer Modal */}
      {claimedModalData && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setClaimedModalData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-1">Offer Applied!</h3>
            <p className="text-xs text-slate-500 mb-4">
              Share this claim code with <strong>{claimedModalData.sellerName}</strong> when they
              provide your service.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300 mb-4">
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 block mb-1">
                Your Offer Claim Code
              </span>
              <span className="text-2xl font-black tracking-widest text-emerald-900">
                {claimedModalData.claimCode}
              </span>
            </div>

            <div className="text-left text-xs space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-5">
              <div>
                <span className="text-slate-400">Service:</span>{' '}
                <strong className="text-slate-800">{claimedModalData.serviceTitleEn}</strong>
              </div>
              <div>
                <span className="text-slate-400">Offer Price:</span>{' '}
                <strong className="text-emerald-600">₹{claimedModalData.offerPrice}</strong>{' '}
                <span className="line-through text-slate-400">
                  ₹{claimedModalData.originalPrice}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Provider:</span>{' '}
                <strong className="text-slate-800">
                  {claimedModalData.sellerName} ({claimedModalData.sellerArea})
                </strong>
              </div>
              {claimedModalData.sellerPhone && (
                <div>
                  <span className="text-slate-400">Direct Phone:</span>{' '}
                  <strong className="text-brand-primary">{claimedModalData.sellerPhone}</strong>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setClaimedModalData(null);
                  setActiveTab('my_applied');
                }}
              >
                View My Applied Offers
              </Button>
              <Button fullWidth onClick={() => setClaimedModalData(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
