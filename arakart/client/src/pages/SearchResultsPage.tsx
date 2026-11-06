import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchProviders, ProviderProfile } from '../services/providerService';
import { fetchCategories, fetchCityAreas, CategoryItem } from '../services/discoveryService';
import { getFavourites, addFavourite, removeFavourite } from '../services/userService';
import { ProviderCard } from '../components/provider/ProviderCard';
import { FilterPanel } from '../components/search/FilterPanel';
import { SortDropdown } from '../components/search/SortDropdown';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { Spinner } from '../components/common/Spinner';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated, user } = useAuthStore();
  const { language, addToast } = useUiStore();

  // URL state
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const area = searchParams.get('area') || '';
  const minRating = Number(searchParams.get('minRating')) || 0;
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
  const sort = searchParams.get('sort') || 'rating';
  const page = Number(searchParams.get('page')) || 1;

  // Search input state
  const [searchInput, setSearchInput] = useState(q);

  // Data states
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProviders, setTotalProviders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favourites state
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(new Set());
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync search input with URL
  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Load categories and dynamic seller-defined areas for Ara
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [cats, cityAreas] = await Promise.all([
          fetchCategories(),
          fetchCityAreas('ara'),
        ]);
        setCategories(cats);
        setAreas(cityAreas.areas || []);
      } catch (err) {
        console.error('Failed to load search metadata', err);
      }
    };
    loadMetadata();
  }, []);

  // Sync user favourites
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.favourites && Array.isArray(user.favourites)) {
        setFavouriteIds(new Set(user.favourites));
      } else {
        getFavourites()
          .then((favs) => {
            const ids = favs.map((f: any) => f.id || f._id);
            setFavouriteIds(new Set(ids));
          })
          .catch(() => {});
      }
    } else {
      setFavouriteIds(new Set());
    }
  }, [isAuthenticated, user?.favourites]);

  // Fetch search results
  const executeSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await searchProviders({
        q: q || undefined,
        category: category || undefined,
        area: area || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        verifiedOnly: verifiedOnly ? true : undefined,
        sort: sort as any,
        page,
        limit: 10,
        city: 'ara',
      });

      setProviders(res.providers || []);
      setTotalPages(res.pagination.pages || 1);
      setTotalProviders(res.pagination.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch search results');
    } finally {
      setIsLoading(false);
    }
  }, [q, category, area, minRating, verifiedOnly, sort, page]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // URL Parameter updater helper
  const updateQueryParam = (updates: Record<string, string | number | boolean | null | undefined>) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 0 || val === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });

    // Reset to page 1 on filter changes unless page itself is updated
    if (!('page' in updates)) {
      nextParams.delete('page');
    }

    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParam({ q: searchInput.trim() });
  };

  const handleCategoryChange = (newCat: string) => {
    updateQueryParam({ category: newCat });
  };

  const handleAreaChange = (newArea: string) => {
    updateQueryParam({ area: newArea });
  };

  const handleMinRatingChange = (newRating: number) => {
    updateQueryParam({ minRating: newRating });
  };

  const handleVerifiedChange = (newVerified: boolean) => {
    updateQueryParam({ verifiedOnly: newVerified });
  };

  const handleSortChange = (newSort: string) => {
    updateQueryParam({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    updateQueryParam({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    const nextParams = new URLSearchParams();
    if (q) nextParams.set('q', q);
    setSearchParams(nextParams);
  };

  const handleToggleFavourite = async (providerId: string) => {
    if (!isAuthenticated || !user) return;

    const isFav = favouriteIds.has(providerId);
    const updated = new Set(favouriteIds);

    if (isFav) {
      updated.delete(providerId);
      setFavouriteIds(new Set(updated));
      try {
        await removeFavourite(providerId);
        addToast(language === 'hi' ? 'पसंदीदा सूची से हटाया गया' : 'Removed from favourites', 'info');
      } catch (err: any) {
        updated.add(providerId);
        setFavouriteIds(new Set(updated));
        addToast('Failed to update favourite', 'error');
      }
    } else {
      updated.add(providerId);
      setFavouriteIds(new Set(updated));
      try {
        await addFavourite(providerId);
        addToast(language === 'hi' ? 'पसंदीदा सूची में जोड़ा गया' : 'Added to favourites', 'success');
      } catch (err: any) {
        updated.delete(providerId);
        setFavouriteIds(new Set(updated));
        addToast('Failed to update favourite', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Search & Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Quick search form */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  language === 'hi'
                    ? 'सेवा, प्रदाता या क्षेत्र खोजें...'
                    : 'Search electrician, AC repair, plumber in Ara...'
                }
                className="w-full pl-10 pr-24 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-4 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                {language === 'hi' ? 'खोजें' : 'Search'}
              </button>
            </form>

            {/* Mobile filter button & Desktop Sort dropdown */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                {language === 'hi' ? 'फ़िल्टर' : 'Filters'}
              </button>

              <SortDropdown value={sort} onChange={handleSortChange} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Results Heading */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {q
                ? `${totalProviders} ${totalProviders === 1 ? 'provider' : 'providers'} found for "${q}"`
                : `${totalProviders} ${totalProviders === 1 ? 'provider' : 'providers'} found in Ara`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'आरा शहर के सत्यापित और भरोसेमंद स्थानीय सेवा प्रदाता'
                : 'Verified & reliable local service professionals across Ara, Bhojpur'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Panel (Left sidebar) */}
          <aside className="hidden md:block md:col-span-1 sticky top-36">
            <FilterPanel
              selectedCategory={category}
              selectedArea={area}
              minRating={minRating}
              verifiedOnly={verifiedOnly}
              categories={categories}
              areas={areas}
              onCategoryChange={handleCategoryChange}
              onAreaChange={handleAreaChange}
              onMinRatingChange={handleMinRatingChange}
              onVerifiedChange={handleVerifiedChange}
              onReset={handleResetFilters}
            />
          </aside>

          {/* Mobile Filter Drawer */}
          {mobileFilterOpen && (
            <div className="md:hidden col-span-1 mb-4">
              <FilterPanel
                selectedCategory={category}
                selectedArea={area}
                minRating={minRating}
                verifiedOnly={verifiedOnly}
                categories={categories}
                areas={areas}
                onCategoryChange={(c) => {
                  handleCategoryChange(c);
                  setMobileFilterOpen(false);
                }}
                onAreaChange={(a) => {
                  handleAreaChange(a);
                  setMobileFilterOpen(false);
                }}
                onMinRatingChange={(r) => {
                  handleMinRatingChange(r);
                  setMobileFilterOpen(false);
                }}
                onVerifiedChange={(v) => {
                  handleVerifiedChange(v);
                  setMobileFilterOpen(false);
                }}
                onReset={() => {
                  handleResetFilters();
                  setMobileFilterOpen(false);
                }}
              />
            </div>
          )}

          {/* Provider Cards Listing (Right column) */}
          <main className="col-span-1 md:col-span-3">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
                <Spinner size="lg" color="indigo" />
                <p className="text-sm font-medium text-slate-500 mt-4">
                  {language === 'hi' ? 'प्रदाता लोड हो रहे हैं...' : 'Loading providers in Ara...'}
                </p>
              </div>
            ) : error ? (
              <EmptyState
                title="Something went wrong"
                description={error}
                actionLabel="Try again"
                onAction={executeSearch}
              />
            ) : providers.length === 0 ? (
              <EmptyState
                title="No service providers found"
                description="We couldn't find any service providers matching your current search criteria in Ara. Try clearing or relaxing some filters."
                actionLabel="Clear all filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {providers.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isFavourite={favouriteIds.has(provider.id)}
                      onToggleFavourite={handleToggleFavourite}
                    />
                  ))}
                </div>

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                  <div className="pt-6">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
