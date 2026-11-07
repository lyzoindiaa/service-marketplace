import React, { useEffect, useState, useCallback } from 'react';
import {
  Tag,
  Plus,
  X,
  Trash2,
  Calendar,
  Clock,
  Users,
  Power,
} from 'lucide-react';
import {
  fetchSellerOffers,
  createSellerOffer,
  updateSellerOffer,
  deleteSellerOffer,
  OfferItem,
  OfferScheduleType,
} from '../../services/offerService';
import { ProviderServiceItem } from '../../services/providerService';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';
import { focusFirstInvalidField } from '../../lib/focusFirstInvalid';

interface SellerOffersManagerProps {
  services: ProviderServiceItem[];
}

export const SellerOffersManager: React.FC<SellerOffersManagerProps> = ({ services }) => {
  const { addToast } = useUiStore();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form fields
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number>(0);
  const [customServiceTitleEn, setCustomServiceTitleEn] = useState('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [titleEn, setTitleEn] = useState('');
  const [titleHi, setTitleHi] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [scheduleType, setScheduleType] = useState<OfferScheduleType>('date_range');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Date range + work hours
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
  const [workHoursStart, setWorkHoursStart] = useState('09:00');
  const [workHoursEnd, setWorkHoursEnd] = useState('18:00');

  // Single day + particular hour slot
  const [singleDate, setSingleDate] = useState(todayStr);
  const [slotStartHour, setSlotStartHour] = useState('14:00');
  const [slotEndHour, setSlotEndHour] = useState('16:00');

  const loadSellerOffers = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const list = await fetchSellerOffers();
      setOffers(list);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load seller offers', 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    loadSellerOffers();
  }, [loadSellerOffers]);

  // Pre-populate originalPrice when selecting a service from catalogue
  useEffect(() => {
    if (services.length > 0 && services[selectedServiceIndex]) {
      const svc = services[selectedServiceIndex];
      setOriginalPrice(String(svc.startingPrice || 500));
    }
  }, [selectedServiceIndex, services]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenService = services[selectedServiceIndex];
    const resolvedServiceTitleEn = chosenService
      ? chosenService.nameEn
      : customServiceTitleEn.trim();
    const resolvedServiceTitleHi = chosenService ? chosenService.nameHi || '' : '';

    const errors: Record<string, string> = {};

    if (!resolvedServiceTitleEn) {
      errors.service = 'Please select or enter a service name for this offer';
    }

    if (!titleEn.trim()) {
      errors.titleEn = 'Offer headline is required';
    }

    const orig = Number(originalPrice);
    const disc = Number(offerPrice);
    if (!orig || orig <= 0) {
      errors.originalPrice = 'Valid original price is required';
    }
    if (!disc || disc <= 0) {
      errors.offerPrice = 'Valid discounted price is required';
    } else if (orig > 0 && disc >= orig) {
      errors.offerPrice = 'Offer price must be lower than original price';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const invalidIds: string[] = [];
      if (errors.service) invalidIds.push('offer-custom-service');
      if (errors.titleEn) invalidIds.push('offer-title-en');
      if (errors.originalPrice) invalidIds.push('offer-orig-price');
      if (errors.offerPrice) invalidIds.push('offer-disc-price');
      setTimeout(() => focusFirstInvalidField(invalidIds), 0);
      addToast(Object.values(errors)[0], 'error');
      return;
    }

    setFieldErrors({});

    try {
      setSubmitting(true);
      await createSellerOffer({
        serviceId: chosenService?.id || '',
        serviceTitleEn: resolvedServiceTitleEn,
        serviceTitleHi: resolvedServiceTitleHi,
        originalPrice: orig,
        offerPrice: disc,
        titleEn: titleEn.trim(),
        titleHi: titleHi.trim(),
        descriptionEn: descriptionEn.trim(),
        scheduleType,
        ...(scheduleType === 'date_range'
          ? {
              startDate,
              endDate,
              workHoursStart,
              workHoursEnd,
            }
          : {
              singleDate,
              slotStartHour,
              slotEndHour,
            }),
      });

      addToast('Service offer published!', 'success');
      setShowCreateForm(false);
      setTitleEn('');
      setTitleHi('');
      setDescriptionEn('');
      setOfferPrice('');
      await loadSellerOffers(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to create service offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (offer: OfferItem) => {
    try {
      await updateSellerOffer(offer.id, { isActive: !offer.isActive });
      addToast(
        !offer.isActive ? 'Offer activated' : 'Offer paused',
        'success'
      );
      await loadSellerOffers(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update offer', 'error');
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      await deleteSellerOffer(offerId);
      addToast('Offer deleted', 'success');
      await loadSellerOffers(true);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete offer', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-primary" />
            Service Offers & Time-Window Deals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Apply special discounts on a particular service for a Date Range + Work Hours or a Single Day + Specific Hour Slot.
          </p>
        </div>
        <Button
          size="md"
          variant={showCreateForm ? 'outline' : 'primary'}
          className="w-full sm:w-48"
          onClick={() => setShowCreateForm((v) => !v)}
        >
          {showCreateForm ? (
            <>
              <X className="w-4 h-4 mr-1.5" />
              <span>Close</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Service Offer</span>
            </>
          )}
        </Button>
      </div>

      {/* Create Offer Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateOffer}
          className="bg-white p-6 rounded-2xl border border-brand-primary/30 shadow-sm space-y-5"
        >
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Apply New Offer to a Service
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Select Particular Service */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Service from Catalogue *
              </label>
              {services.length > 0 ? (
                <select
                  value={selectedServiceIndex}
                  onChange={(e) => {
                    setSelectedServiceIndex(Number(e.target.value));
                    if (fieldErrors.service) setFieldErrors((prev) => ({ ...prev, service: '' }));
                  }}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  {services.map((svc, idx) => (
                    <option key={svc.id || idx} value={idx}>
                      {svc.nameEn} (Base Price: ₹{svc.startingPrice})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="offer-custom-service"
                  type="text"
                  value={customServiceTitleEn}
                  onChange={(e) => {
                    setCustomServiceTitleEn(e.target.value);
                    if (fieldErrors.service) setFieldErrors((prev) => ({ ...prev, service: '' }));
                  }}
                  placeholder="e.g. Split AC Foam Jet Servicing"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-colors ${
                    fieldErrors.service
                      ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                      : 'border-slate-200'
                  }`}
                />
              )}
            </div>

            {/* Offer Title */}
            <div>
              <label htmlFor="offer-title-en" className="block text-xs font-bold text-slate-700 mb-1.5">
                Offer Headline (English) *
              </label>
              <input
                id="offer-title-en"
                type="text"
                value={titleEn}
                onChange={(e) => {
                  setTitleEn(e.target.value);
                  if (fieldErrors.titleEn) setFieldErrors((prev) => ({ ...prev, titleEn: '' }));
                }}
                placeholder="e.g. Summer Afternoon AC Servicing Deal"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-colors ${
                  fieldErrors.titleEn
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                    : 'border-slate-200'
                }`}
              />
              {fieldErrors.titleEn && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.titleEn}</p>
              )}
            </div>

            <div>
              <label htmlFor="offer-orig-price" className="block text-xs font-bold text-slate-700 mb-1.5">
                Original Service Price (₹) *
              </label>
              <input
                id="offer-orig-price"
                type="number"
                min={1}
                value={originalPrice}
                onChange={(e) => {
                  setOriginalPrice(e.target.value);
                  if (fieldErrors.originalPrice) setFieldErrors((prev) => ({ ...prev, originalPrice: '' }));
                }}
                placeholder="599"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-colors ${
                  fieldErrors.originalPrice
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                    : 'border-slate-200'
                }`}
              />
              {fieldErrors.originalPrice && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.originalPrice}</p>
              )}
            </div>

            <div>
              <label htmlFor="offer-disc-price" className="block text-xs font-bold text-slate-700 mb-1.5">
                Discounted Offer Price (₹) *
              </label>
              <input
                id="offer-disc-price"
                type="number"
                min={1}
                value={offerPrice}
                onChange={(e) => {
                  setOfferPrice(e.target.value);
                  if (fieldErrors.offerPrice) setFieldErrors((prev) => ({ ...prev, offerPrice: '' }));
                }}
                placeholder="399"
                className={`w-full px-3.5 py-2.5 text-sm border rounded-xl transition-colors ${
                  fieldErrors.offerPrice
                    ? 'border-red-500 ring-1 ring-red-500 text-red-900 focus:border-red-600 focus:ring-red-200 bg-white'
                    : 'border-slate-200'
                }`}
              />
              {fieldErrors.offerPrice && (
                <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.offerPrice}</p>
              )}
            </div>
          </div>

          {/* Step 2: Schedule Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Offer Schedule Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScheduleType('date_range')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  scheduleType === 'date_range'
                    ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  📅 Date Range + Working Hours
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Run offer across multiple days during specific daily work hours (e.g. 10:00 to 17:00).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScheduleType('single_day_slot')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  scheduleType === 'single_day_slot'
                    ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  ⚡ Single Day + Particular Hour Slot
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Flash deal on a single date during a specific hour window (e.g. 14:00 to 16:00).
                </p>
              </button>
            </div>
          </div>

          {/* Schedule Inputs */}
          {scheduleType === 'date_range' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Hours Start *
                </label>
                <input
                  type="time"
                  required
                  value={workHoursStart}
                  onChange={(e) => setWorkHoursStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Hours End *
                </label>
                <input
                  type="time"
                  required
                  value={workHoursEnd}
                  onChange={(e) => setWorkHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/70">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offer Date *
                </label>
                <input
                  type="date"
                  required
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slot Start Hour *
                </label>
                <input
                  type="time"
                  required
                  value={slotStartHour}
                  onChange={(e) => setSlotStartHour(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Slot End Hour *
                </label>
                <input
                  type="time"
                  required
                  value={slotEndHour}
                  onChange={(e) => setSlotEndHour(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Terms / Short Description (Optional)
            </label>
            <input
              type="text"
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="e.g. Includes filter cleaning and pressure check during valid hours"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full sm:w-36"
              onClick={() => setShowCreateForm(false)}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-36"
              isLoading={submitting}
            >
              Publish Offer
            </Button>
          </div>
        </form>
      )}

      {/* Existing Seller Offers List */}
      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Offers Applied Yet</p>
          <p className="text-xs text-slate-500 mt-1">
            Click &ldquo;Create Service Offer&rdquo; above to promote a service on a date range or single-day hour slot.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base font-bold text-slate-900">{offer.titleEn}</span>
                    <Badge variant={offer.isActive ? 'success' : 'closed'}>
                      {offer.isActive ? `Active (${offer.computedStatus})` : 'Paused'}
                    </Badge>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {offer.discountPercent}% OFF (₹{offer.offerPrice} vs ₹{offer.originalPrice})
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-brand-primary">
                    🛠️ Service: {offer.serviceTitleEn}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(offer)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    <Power className="w-3.5 h-3.5" />
                    {offer.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Schedule Window */}
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
                      Hour Slot: {offer.slotStartHour} – {offer.slotEndHour}
                    </span>
                  </>
                )}
                <span className="inline-flex items-center gap-1 ml-auto font-bold text-slate-800">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {offer.claimsCount} Customer(s) Applied
                </span>
              </div>

              {/* Customers who applied this offer */}
              {offer.appliedCustomers && offer.appliedCustomers.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-700 mb-2">
                    Customers Who Applied This Offer:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {offer.appliedCustomers.map((app) => (
                      <div
                        key={app.applicationId}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">
                            {app.customer?.name || 'Customer'}
                          </span>
                          {app.customer?.phone && (
                            <span className="text-slate-500 ml-2">{app.customer.phone}</span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          {app.claimCode}
                        </span>
                      </div>
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
