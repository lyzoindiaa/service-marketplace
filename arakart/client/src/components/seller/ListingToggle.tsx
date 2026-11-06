import React, { useState } from 'react';
import { toggleSellerLive } from '../../services/sellerService';
import { useUiStore } from '../../store/uiStore';

export interface ListingToggleProps {
  isLive: boolean;
  status: 'pending' | 'approved' | 'rejected';
  onToggled: (newLiveStatus: boolean) => void;
  className?: string;
}

export const ListingToggle: React.FC<ListingToggleProps> = ({
  isLive,
  status,
  onToggled,
  className = '',
}) => {
  const { addToast } = useUiStore();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (status === 'pending') {
      addToast('Your profile is currently under review by AraKart administrators', 'info');
      return;
    }
    if (status === 'rejected') {
      addToast('Your listing was rejected. Please contact AraKart support.', 'error');
      return;
    }

    setLoading(true);
    try {
      const updated = await toggleSellerLive();
      onToggled(updated.isLive);
      addToast(
        updated.isLive ? 'Your business listing is now LIVE in Ara!' : 'Your business listing is now paused (offline).',
        'success'
      );
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to toggle listing status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-label="Toggle live listing"
        aria-checked={isLive}
        disabled={loading || status !== 'approved'}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          isLive ? 'bg-emerald-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
            isLive ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-xs font-bold text-slate-700">
        {status === 'pending'
          ? 'Pending Approval'
          : isLive
          ? 'Listing is Live in Ara'
          : 'Listing Paused'}
      </span>
    </div>
  );
};
