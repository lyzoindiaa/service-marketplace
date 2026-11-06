import React, { useState } from 'react';
import { ProviderProfile } from '../../services/providerService';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { createLead } from '../../services/leadService';
import { submitReport } from '../../services/userService';

export interface ContactBoxProps {
  provider: ProviderProfile;
  isFavourite?: boolean;
  onToggleFavourite?: (providerId: string) => void;
  className?: string;
}

export const ContactBox: React.FC<ContactBoxProps> = ({
  provider,
  isFavourite = false,
  onToggleFavourite,
  className = '',
}) => {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal, addToast, language } = useUiStore();

  const [unmaskedPhone, setUnmaskedPhone] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('fake_profile');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleCall = async () => {
    if (!isAuthenticated) {
      addToast('Please login to call providers', 'info');
      openAuthModal();
      return;
    }

    if (unmaskedPhone) {
      try {
        window.location.href = `tel:${unmaskedPhone}`;
      } catch {}
      return;
    }

    setIsCalling(true);
    try {
      const res = await createLead({
        providerId: provider.id,
        type: 'call',
      });
      const revealedPhone = res.unmaskedPhone || (res as any).phone;
      setUnmaskedPhone(revealedPhone);
      try {
        window.location.href = `tel:${revealedPhone}`;
      } catch {}
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to initiate call', 'error');
    } finally {
      setIsCalling(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!isAuthenticated) {
      addToast('Please login to message providers on WhatsApp', 'info');
      openAuthModal();
      return;
    }

    setIsMessaging(true);
    try {
      const res = await createLead({
        providerId: provider.id,
        type: 'whatsapp',
      });

      const phoneForWa = (res.whatsapp || res.unmaskedPhone).replace(/\D/g, '');
      const cleanPhone =
        phoneForWa.startsWith('91') && phoneForWa.length === 12
          ? phoneForWa
          : `91${phoneForWa.replace(/^0+/, '')}`;

      const prefilledText = encodeURIComponent(
        `Hi ${provider.nameEn}, I found your listing on AraKart and would like to hire your service in ${provider.area}, Ara.`
      );

      window.open(
        `https://wa.me/${cleanPhone}?text=${prefilledText}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to open WhatsApp', 'error');
    } finally {
      setIsMessaging(false);
    }
  };

  const handleFavourite = async () => {
    if (!isAuthenticated) {
      addToast('Please login to save favourite providers', 'info');
      openAuthModal();
      return;
    }

    if (onToggleFavourite) {
      onToggleFavourite(provider.id);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setIsSubmittingReport(true);
    try {
      await submitReport({
        providerId: provider.id,
        reason: reportReason,
        details: reportDetails,
      });
      addToast('Thank you! Your report has been submitted to AraKart moderation team.', 'success');
      setReportModalOpen(false);
      setReportDetails('');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-5 ${className}`}
    >
      {/* Starting Price & Timings */}
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium block">
            {language === 'hi' ? 'शुरुआती कीमत' : 'Starting from'}
          </span>
          <span className="text-2xl font-bold text-indigo-700">
            ₹{provider.fromPrice || 99}
          </span>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {provider.isAllDay ? '24/7 Open' : 'Open Today'}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">
            {provider.workingHours || '8:00 AM - 8:00 PM'}
          </span>
        </div>
      </div>

      {/* Main Direct Actions: Call & WhatsApp */}
      <div className="space-y-2.5">
        <Button
          variant="secondary"
          size="md"
          className="w-full text-sm font-bold"
          onClick={handleCall}
          loading={isCalling}
          aria-label="Call"
          icon={
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        >
          {unmaskedPhone ? `Call: ${unmaskedPhone}` : 'Call Provider'}
        </Button>

        <Button
          variant="whatsapp"
          size="md"
          className="w-full text-sm font-bold"
          onClick={handleWhatsApp}
          loading={isMessaging}
          aria-label="WhatsApp"
          icon={
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.991.56 1.767.818 2.796.818 3.182 0 5.768-2.587 5.768-5.768.001-3.18-2.585-5.802-5.768-5.802zm9.969 5.768c0 5.523-4.477 10-10 10-1.748 0-3.385-.45-4.819-1.24L2 22l1.503-5.068C2.656 15.428 2 13.805 2 11.94c0-5.523 4.477-10 10-10s10 4.477 10 10z" />
            </svg>
          }
        >
          Chat on WhatsApp
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs font-semibold"
          onClick={handleFavourite}
          icon={
            <svg
              className={`w-4 h-4 ${isFavourite ? 'text-rose-500 fill-current' : 'text-slate-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        >
          {isFavourite ? 'Saved in Favourites' : 'Save to Favourites'}
        </Button>
      </div>

      {/* Service Area Pill Details */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          {language === 'hi' ? 'सेवा क्षेत्र' : 'Areas Served in Ara'}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-100">
            📍 {provider.area} (Primary)
          </span>
          {provider.areasServed &&
            provider.areasServed
              .filter((a) => a !== provider.area)
              .map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs"
                >
                  {area}
                </span>
              ))}
        </div>
      </div>

      {/* Report Listing Trigger */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400">Listing ID: {provider.id.substring(0, 8)}</span>
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              addToast('Please login to report a listing', 'info');
              openAuthModal();
            } else {
              setReportModalOpen(true);
            }
          }}
          className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 font-medium"
        >
          <span>🚩</span>
          {language === 'hi' ? 'रिपोर्ट करें' : 'Report listing'}
        </button>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <Modal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          title="Report this Listing"
        >
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Help keep AraKart trustworthy. Please specify why you are reporting{' '}
              <strong className="text-slate-800">{provider.nameEn}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 font-medium"
              >
                <option value="fake_profile">Fake / Inaccurate Profile</option>
                <option value="overcharging">Overcharging / Fraudulent pricing</option>
                <option value="bad_behavior">Rude / Unprofessional behavior</option>
                <option value="no_response">Phone number not reachable / Fake number</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Additional Details
              </label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any specific details to assist our Ara moderation team..."
                className="w-full text-sm rounded-xl border border-slate-200 p-2.5 bg-slate-50 resize-none font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                loading={isSubmittingReport}
              >
                Submit Report
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
