import React, { useEffect, useState, useCallback } from 'react';
import { Tag, Calendar, Clock, Trash2, Users } from 'lucide-react';
import {
  fetchAdminOffers,
  deleteSellerOffer,
  OfferItem,
} from '../../services/offerService';
import { useUiStore } from '../../store/uiStore';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';

export const AdminOffersManager: React.FC = () => {
  const { addToast } = useUiStore();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState<'all' | 'date_range' | 'single_day_slot'>('all');

  const loadAdminOffers = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const list = await fetchAdminOffers({
        scheduleType: tabFilter !== 'all' ? tabFilter : undefined,
      });
      setOffers(list);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load offers', 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [tabFilter, addToast]);

  useEffect(() => {
    loadAdminOffers();
  }, [loadAdminOffers]);

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteSellerOffer(offerId);
      addToast('Offer removed by Admin', 'success');
      await loadAdminOffers(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to remove offer', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-primary" />
            Seller Applied Service Offers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor all offers available or applied by sellers across Date Range + Work Hours and Single-Day Hour Slots.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              tabFilter === 'all'
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Offers ({offers.length})
          </button>
          <button
            onClick={() => setTabFilter('date_range')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              tabFilter === 'date_range'
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📅 Date Range + Work Hours
          </button>
          <button
            onClick={() => setTabFilter('single_day_slot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              tabFilter === 'single_day_slot'
                ? 'bg-brand-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⚡ Single-Day Hour Slot
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="md" />
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            No Seller Offers Found for This Filter
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base font-bold text-slate-900">{offer.titleEn}</span>
                    <Badge
                      variant={
                        offer.computedStatus === 'live_now'
                          ? 'success'
                          : offer.computedStatus === 'upcoming'
                          ? 'pending'
                          : 'closed'
                      }
                    >
                      {offer.computedStatus.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {offer.discountPercent}% OFF (₹{offer.offerPrice} vs ₹{offer.originalPrice})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong>Seller:</strong> {offer.seller?.nameEn || 'Unknown'} (
                    {offer.seller?.area}, {offer.city.toUpperCase()}) &bull;{' '}
                    <strong className="text-brand-primary">
                      Service Applied: {offer.serviceTitleEn}
                    </strong>
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteOffer(offer.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 self-start sm:self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Offer
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                {offer.scheduleType === 'date_range' ? (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                      Date Range: {offer.startDate} to {offer.endDate}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Work Hours: {offer.workHoursStart} – {offer.workHoursEnd}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                      Single Day: {offer.singleDate}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Particular Hour: {offer.slotStartHour} – {offer.slotEndHour}
                    </span>
                  </>
                )}

                <span className="inline-flex items-center gap-1 ml-auto font-bold text-slate-800">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {offer.claimsCount} Customer Claim(s)
                </span>
              </div>

              {offer.appliedCustomers && offer.appliedCustomers.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Customer Applications ({offer.appliedCustomers.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {offer.appliedCustomers.map((c) => (
                      <span
                        key={c.applicationId}
                        className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200"
                      >
                        <strong>{c.customer?.name || 'Customer'}</strong> ({c.claimCode})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
