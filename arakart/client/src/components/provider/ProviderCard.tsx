import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProviderProfile } from '../../services/providerService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StarRating } from '../common/StarRating';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { createLead } from '../../services/leadService';

export interface ProviderCardProps {
  provider: ProviderProfile;
  isFavourite?: boolean;
  showRemoveLabel?: boolean;
  onToggleFavourite?: (providerId: string) => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  isFavourite = false,
  showRemoveLabel = false,
  onToggleFavourite,
}) => {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal, addToast, language } = useUiStore();

  const [unmaskedPhone, setUnmaskedPhone] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  const resolvedProviderId = provider.id || (provider as any)._id;

  // Fallback initial letter & brand gradient avatar
  const displayName = language === 'hi' && provider.nameHi ? provider.nameHi : provider.nameEn;
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : 'P';

  const handleCallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast('Please login to call providers', 'info');
      openAuthModal();
      return;
    }

    if (unmaskedPhone) {
      try {
        window.location.href = `tel:${unmaskedPhone}`;
      } catch {
        // Safe for test/jsdom environments
      }
      return;
    }

    setIsCalling(true);
    try {
      const res = await createLead({
        providerId: resolvedProviderId,
        type: 'call',
      });
      const revealedPhone = res.unmaskedPhone || (res as any).phone;
      setUnmaskedPhone(revealedPhone);
      try {
        window.location.href = `tel:${revealedPhone}`;
      } catch {
        // Safe for test/jsdom environments
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to initiate call', 'error');
    } finally {
      setIsCalling(false);
    }
  };

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast('Please login to message providers on WhatsApp', 'info');
      openAuthModal();
      return;
    }

    setIsMessaging(true);
    try {
      const res = await createLead({
        providerId: resolvedProviderId,
        type: 'whatsapp',
      });

      const phoneForWa = (res.whatsapp || res.unmaskedPhone).replace(/\D/g, '');
      const cleanPhone =
        phoneForWa.startsWith('91') && phoneForWa.length === 12
          ? phoneForWa
          : `91${phoneForWa.replace(/^0+/, '')}`;

      const prefilledText = encodeURIComponent(
        `Hi ${provider.nameEn}, I found your profile on AraKart and would like to inquire about your services in ${provider.area}.`
      );

      window.open(`https://wa.me/${cleanPhone}?text=${prefilledText}`, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to open WhatsApp', 'error');
    } finally {
      setIsMessaging(false);
    }
  };

  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      addToast('Please login to save favourite providers', 'info');
      openAuthModal();
      return;
    }

    if (onToggleFavourite && resolvedProviderId) {
      onToggleFavourite(resolvedProviderId);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative">
      {/* Top section: Avatar, Info & Heart */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <Link to={`/provider/${resolvedProviderId}`} className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Avatar / Photo */}
            <div className="relative shrink-0">
              {provider.photos && provider.photos.length > 0 ? (
                <img
                  src={provider.photos[0]}
                  alt={displayName}
                  className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  {initialLetter}
                </div>
              )}
            </div>

            {/* Provider title, category & locality */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {displayName}
                </h3>
                {provider.verified && (
                  <Badge variant="verified" className="text-[11px] py-0.5">
                    ✓ Verified
                  </Badge>
                )}
              </div>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <StarRating rating={provider.avgRating || 0} size="sm" />
                  <span className="text-xs font-semibold text-slate-800 ml-0.5">
                    {provider.avgRating ? provider.avgRating.toFixed(1) : 'New'}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  ({provider.reviewCount || 0})
                </span>
                {(provider.experience ?? 0) > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {provider.experience} yrs exp
                    </span>
                  </>
                )}
              </div>

              {/* Locality & Areas Served */}
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 truncate">
                <svg
                  className="w-3.5 h-3.5 text-indigo-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium text-slate-700">{provider.area}</span>
                {provider.areasServed && provider.areasServed.length > 1 && (
                  <span className="text-[11px] text-slate-400 truncate">
                    (+{provider.areasServed.length - 1} nearby)
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Favourite Heart / Remove Button */}
          <button
            type="button"
            aria-label="favourite"
            title={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
            onClick={handleFavouriteClick}
            className={`transition-colors shrink-0 ${
              showRemoveLabel && isFavourite
                ? 'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80'
                : isFavourite
                  ? 'p-2 rounded-full text-rose-500 bg-rose-50 hover:bg-rose-100'
                  : 'p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-50'
            }`}
          >
            <svg
              className={showRemoveLabel && isFavourite ? 'w-3.5 h-3.5' : 'w-5 h-5'}
              fill={isFavourite ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {showRemoveLabel && isFavourite && <span>Remove</span>}
          </button>
        </div>

        {/* Services & Starting Price Preview */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-500 font-medium">Starting from</span>
            <span className="text-sm font-bold text-indigo-700">
              ₹{provider.fromPrice || 99}
            </span>
          </div>

          {provider.services && provider.services.length > 0 && (
            <div className="space-y-1.5 bg-slate-50/75 rounded-xl p-2.5">
              {provider.services.slice(0, 2).map((srv, idx) => (
                <div key={srv.id || idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate pr-2">
                    {language === 'hi' && srv.nameHi ? srv.nameHi : srv.nameEn}
                  </span>
                  <span className="text-slate-900 font-semibold shrink-0">
                    ₹{srv.startingPrice}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Phone & WhatsApp */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={handleCallClick}
          loading={isCalling}
          aria-label="Call"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          }
        >
          {unmaskedPhone ? unmaskedPhone : 'Call'}
        </Button>

        <Button
          variant="whatsapp"
          size="md"
          className="flex-1"
          onClick={handleWhatsAppClick}
          loading={isMessaging}
          aria-label="WhatsApp"
          icon={
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.991.56 1.767.818 2.796.818 3.182 0 5.768-2.587 5.768-5.768.001-3.18-2.585-5.802-5.768-5.802zm9.969 5.768c0 5.523-4.477 10-10 10-1.748 0-3.385-.45-4.819-1.24L2 22l1.503-5.068C2.656 15.428 2 13.805 2 11.94c0-5.523 4.477-10 10-10s10 4.477 10 10z" />
            </svg>
          }
        >
          WhatsApp
        </Button>
      </div>
    </div>
  );
};
