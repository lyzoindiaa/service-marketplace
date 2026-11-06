import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavourites, removeFavourite } from '../services/userService';
import { ProviderProfile } from '../services/providerService';
import { ProviderCard } from '../components/provider/ProviderCard';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

export const CustomerFavouritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();

  const [favourites, setFavourites] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavourites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFavourites();
      setFavourites(data || []);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load saved providers', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadFavourites();
  }, [isAuthenticated, navigate, loadFavourites]);

  const handleToggleFavourite = async (providerId: string) => {
    try {
      await removeFavourite(providerId);
      setFavourites((prev) => prev.filter((p) => p.id !== providerId));
      addToast('Removed from favourites', 'info');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to update favourite', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-light mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink">My Saved Providers</h1>
          <p className="text-ink-muted text-sm mt-1">
            Quick access to your favourite technicians, shops, and services in Ara.
          </p>
        </div>

        {favourites.length > 0 && (
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            {favourites.length} saved {favourites.length === 1 ? 'business' : 'businesses'}
          </span>
        )}
      </div>

      {favourites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs max-w-lg mx-auto">
          <span className="text-5xl mb-4 block">❤️</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Saved Providers</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            You haven't saved any service providers yet. Tap the heart icon on any provider profile across Ara to keep them here for fast repeat bookings!
          </p>
          <Button variant="primary" onClick={() => navigate('/search')}>
            Explore Services in Ara
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favourites.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isFavourite={true}
              onToggleFavourite={handleToggleFavourite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
