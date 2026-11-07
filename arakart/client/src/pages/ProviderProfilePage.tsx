import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProviderById, ProviderProfile } from '../services/providerService';
import {
  fetchProviderReviews,
  ReviewItemData,
  ProviderReviewsResponse,
} from '../services/reviewService';
import { addFavourite, removeFavourite, getFavourites } from '../services/userService';
import { Badge } from '../components/common/Badge';
import { StarRating } from '../components/common/StarRating';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { ReviewItem } from '../components/provider/ReviewItem';
import { ReviewForm } from '../components/provider/ReviewForm';
import { ContactBox } from '../components/provider/ContactBox';
import { GalleryGrid } from '../components/provider/GalleryGrid';
import { Button } from '../components/common/Button';
import { fetchPublicOffers, applyOffer, OfferItem } from '../services/offerService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export const ProviderProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const { language, addToast, openAuthModal } = useUiStore();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [providerOffers, setProviderOffers] = useState<OfferItem[]>([]);
  const [applyingOfferId, setApplyingOfferId] = useState<string | null>(null);
  const [reviewsData, setReviewsData] = useState<ProviderReviewsResponse | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavourite, setIsFavourite] = useState(false);

  // Load provider details
  const loadProvider = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getProviderById(id);
      setProvider(data);
      try {
        const offersList = await fetchPublicOffers({ sellerId: id });
        setProviderOffers(offersList);
      } catch {
        setProviderOffers([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Provider not found');
    }
  }, [id]);

  const handleApplyProviderOffer = async (offer: OfferItem) => {
    if (!isAuthenticated) {
      addToast('Please sign in to apply this service offer', 'info');
      openAuthModal();
      return;
    }
    try {
      setApplyingOfferId(offer.id);
      const res = await applyOffer(offer.id);
      addToast(
        `Offer Applied! Claim Code: ${res.application.claimCode} for ${res.application.serviceTitleEn}`,
        'success'
      );
      const updatedOffers = await fetchPublicOffers({ sellerId: id });
      setProviderOffers(updatedOffers);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to apply offer', 'error');
    } finally {
      setApplyingOfferId(null);
    }
  };

  // Load reviews
  const loadReviews = useCallback(
    async (pageToLoad = 1) => {
      if (!id) return;
      try {
        const data = await fetchProviderReviews(id, pageToLoad, 10);
        setReviewsData(data);
      } catch (err) {
        console.error('Failed to load reviews', err);
      }
    },
    [id]
  );

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadProvider(), loadReviews(1)]).finally(() => {
      setIsLoading(false);
    });
  }, [loadProvider, loadReviews]);

  // Sync favourites status
  useEffect(() => {
    if (isAuthenticated && id) {
      if (user?.favourites) {
        setIsFavourite(user.favourites.includes(id));
      } else {
        getFavourites()
          .then((favs) => {
            const has = favs.some((f: any) => (f.id || f._id) === id);
            setIsFavourite(has);
          })
          .catch(() => {});
      }
    } else {
      setIsFavourite(false);
    }
  }, [isAuthenticated, user?.favourites, id]);

  const handleToggleFavourite = async (providerId: string) => {
    if (!isAuthenticated) return;

    if (isFavourite) {
      setIsFavourite(false);
      try {
        await removeFavourite(providerId);
        addToast(language === 'hi' ? 'पसंदीदा सूची से हटाया गया' : 'Removed from favourites', 'info');
      } catch {
        setIsFavourite(true);
        addToast('Failed to update favourite', 'error');
      }
    } else {
      setIsFavourite(true);
      try {
        await addFavourite(providerId);
        addToast(language === 'hi' ? 'पसंदीदा सूची में जोड़ा गया' : 'Added to favourites', 'success');
      } catch {
        setIsFavourite(false);
        addToast('Failed to update favourite', 'error');
      }
    }
  };

  const handleReviewSubmitted = (_newReview: ReviewItemData) => {
    // Refresh reviews and provider rating
    loadReviews(1);
    loadProvider();
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Spinner size="lg" color="indigo" />
        <p className="text-sm font-medium text-slate-500 mt-4">
          {language === 'hi' ? 'प्रदाता प्रोफ़ाइल लोड हो रही है...' : 'Loading provider profile...'}
        </p>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="Provider Not Found"
          description={error || "The provider profile you're looking for does not exist or has been deactivated."}
          actionLabel="Back to Search"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const displayName = language === 'hi' && provider.nameHi ? provider.nameHi : provider.nameEn;
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'P';
  const bio = language === 'hi' && provider.bioHi ? provider.bioHi : provider.bioEn;

  const totalReviews = reviewsData ? reviewsData.summary.totalReviews : (provider.reviewCount || 0);
  const avgRating =
    reviewsData && reviewsData.summary.totalReviews > 0
      ? reviewsData.summary.avgRating
      : (provider.avgRating || 0);
  const breakdown = reviewsData?.summary.breakdown || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Breadcrumbs Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-indigo-600 transition-colors">
              {language === 'hi' ? 'होम' : 'Home'}
            </Link>
            <span>/</span>
            <Link to="/search" className="hover:text-indigo-600 transition-colors">
              Services
            </Link>
            <span>/</span>
            {provider.categories && provider.categories.length > 0 && (
              <>
                <Link
                  to={`/search?category=${provider.categories[0]}`}
                  className="hover:text-indigo-600 transition-colors capitalize"
                >
                  {provider.categories[0].replace('-', ' ')}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-slate-900 font-semibold truncate max-w-xs">{displayName}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Details Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Avatar / Photo */}
                <div className="relative shrink-0">
                  {provider.photos && provider.photos.length > 0 ? (
                    <img
                      src={provider.photos[0]}
                      alt={displayName}
                      className="w-24 h-24 rounded-2xl object-cover border border-slate-100 shadow-xs"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-3xl shadow-xs">
                      {initial}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                      {displayName}
                    </h1>
                    {provider.verified && (
                      <Badge variant="verified" className="text-xs py-1">
                        ✓ Verified Business
                      </Badge>
                    )}
                    {provider.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        ⏳ Pending Approval (Preview Mode)
                      </span>
                    )}
                    {!provider.isLive && provider.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                        ⏸️ Currently Paused / Offline
                      </span>
                    )}
                    {providerOffers.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                        🔥 {providerOffers.length} Offer{providerOffers.length > 1 ? 's' : ''} Available
                      </span>
                    )}
                  </div>

                  {/* Rating + Reviews + Experience */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={avgRating} size="sm" />
                      <span className="text-sm font-bold text-slate-800">
                        {avgRating ? avgRating.toFixed(1) : 'New'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                    {provider.experience && provider.experience > 0 && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {provider.experience} years experience
                        </span>
                      </>
                    )}
                  </div>

                  {/* Locality & City */}
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-600">
                    <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-semibold text-slate-800">{provider.area}</span>
                  </div>
                </div>
              </div>

              {/* Bio / About */}
              {bio && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {language === 'hi' ? 'प्रदाता के बारे में' : 'About this Provider'}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                    {bio}
                  </p>
                </div>
              )}
            </div>

            {/* Active Service Offers Section */}
            {providerOffers.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-extrabold text-amber-950 flex items-center gap-2">
                    🔥 {language === 'hi' ? 'सक्रिय सेवा ऑफ़र' : 'Active Service Offers'}
                  </h3>
                  <Link
                    to="/offers"
                    className="text-xs font-bold text-brand-primary hover:underline"
                  >
                    View All Platform Offers →
                  </Link>
                </div>

                <div className="space-y-3">
                  {providerOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-white rounded-xl border border-amber-200/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-extrabold text-slate-900">
                            {offer.titleEn}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {offer.discountPercent}% OFF
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-brand-primary mb-1">
                          🛠️ Service: {offer.serviceTitleEn} &bull; Offer Price:{' '}
                          <strong className="text-emerald-600">₹{offer.offerPrice}</strong>{' '}
                          <span className="line-through text-slate-400">
                            ₹{offer.originalPrice}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {offer.scheduleType === 'date_range'
                            ? `📅 ${offer.startDate} to ${offer.endDate} (Work Hours: ${offer.workHoursStart}–${offer.workHoursEnd})`
                            : `⚡ Single Day: ${offer.singleDate} (Hour Slot: ${offer.slotStartHour}–${offer.slotEndHour})`}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        isLoading={applyingOfferId === offer.id}
                        onClick={() => handleApplyProviderOffer(offer)}
                      >
                        {offer.hasCustomerApplied ? '✓ Applied' : 'Apply Offer'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services Catalogue Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'hi' ? 'सेवाएं एवं मूल्य सूची' : 'Services & Pricing'}
                </h3>
                <span className="text-xs text-slate-400">Fixed & Starting rates</span>
              </div>

              <div className="divide-y divide-slate-100">
                {provider.services && provider.services.length > 0 ? (
                  provider.services.map((srv, idx) => (
                    <div
                      key={srv.id || idx}
                      className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          {language === 'hi' && srv.nameHi ? srv.nameHi : srv.nameEn}
                        </h4>
                        <span className="text-xs text-slate-400">Standard service</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-indigo-700">
                          ₹{srv.startingPrice}
                        </span>
                        <span className="text-[11px] text-slate-400 block">starting</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 py-4">No specific services listed.</p>
                )}
              </div>
            </div>

            {/* Work & Shop Photos */}
            {provider.photos && provider.photos.length > 0 && (
              <GalleryGrid photos={provider.photos} providerName={provider.nameEn} />
            )}

            {/* Ratings & Reviews Section */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">
                  {language === 'hi' ? 'ग्राहक समीक्षाएं एवं रेटिंग' : 'Ratings & Customer Reviews'}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {/* Rating Summary Breakdown Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
                <div className="flex flex-col items-center justify-center text-center sm:border-r border-slate-200 sm:pr-4">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {avgRating ? avgRating.toFixed(1) : '0.0'}
                  </span>
                  <div className="mt-1">
                    <StarRating rating={avgRating} size="md" />
                  </div>
                  <span className="text-xs text-slate-500 mt-1">
                    Based on {totalReviews} reviews
                  </span>
                </div>

                <div className="sm:col-span-2 space-y-1.5 justify-center flex flex-col">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = breakdown[String(star)] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-6 font-semibold text-slate-600">{star} ★</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-slate-400 font-medium">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Submission Form */}
              <div className="mb-8">
                <ReviewForm
                  providerId={provider.id}
                  onReviewSubmitted={handleReviewSubmitted}
                />
              </div>

              {/* Reviews List */}
              <div className="space-y-1">
                {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
                  reviewsData.reviews.map((rev) => (
                    <ReviewItem key={rev.id} review={rev} />
                  ))
                ) : (
                  <p className="text-sm text-slate-500 py-6 text-center">
                    {language === 'hi'
                      ? 'अभी तक कोई समीक्षा नहीं है। पहले ग्राहक बनें जो समीक्षा लिखें!'
                      : 'No reviews yet for this provider. Be the first to share your experience!'}
                  </p>
                )}
              </div>

              {/* Pagination */}
              {reviewsData?.pagination && reviewsData.pagination.pages > 1 && (
                <div className="pt-6 border-t border-slate-100">
                  <Pagination
                    currentPage={reviewsPage}
                    totalPages={reviewsData.pagination.pages}
                    onPageChange={(p) => {
                      setReviewsPage(p);
                      loadReviews(p);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Sticky Sidebar (1/3) */}
          <aside className="lg:col-span-1 sticky top-20 space-y-6">
            <ContactBox
              provider={provider}
              isFavourite={isFavourite}
              onToggleFavourite={handleToggleFavourite}
            />
          </aside>
        </div>
      </div>
    </div>
  );
};
