import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import {
  getMySellerProfile,
  getSellerStats,
  SellerStatsResponse,
} from '../services/sellerService';
import { ProviderProfile, ProviderServiceItem } from '../services/providerService';
import { getSellerLeads } from '../services/leadService';
import { fetchProviderReviews, ReviewItemData } from '../services/reviewService';
import { fetchSellerOffers, OfferItem } from '../services/offerService';
import { useSocket } from '../hooks/useSocket';
import { Spinner } from '../components/common/Spinner';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { SellerOverview } from '../components/seller/SellerOverview';
import { LeadsTable, LeadItem } from '../components/seller/LeadsTable';
import { CatalogueEditor } from '../components/seller/CatalogueEditor';
import { ReviewsManager } from '../components/seller/ReviewsManager';
import { ProfileEditor } from '../components/seller/ProfileEditor';
import { SellerOffersManager } from '../components/seller/SellerOffersManager';

type DashboardTab = 'overview' | 'leads' | 'catalogue' | 'offers' | 'reviews' | 'profile';

const VALID_TABS: DashboardTab[] = ['overview', 'leads', 'catalogue', 'offers', 'reviews', 'profile'];

export const SellerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as DashboardTab | null;

  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();

  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'overview';
  });

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    loadDashboardData(true);
  };
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<SellerStatsResponse | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItemData[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadLeadsCount, setUnreadLeadsCount] = useState(0);
  const hasLoadedRef = useRef(false);

  const { socket } = useSocket(profile?.id);

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const [profData, statsData] = await Promise.all([
        getMySellerProfile(),
        getSellerStats(),
      ]);

      setProfile(profData);
      setStats(statsData);

      // Fetch initial leads
      try {
        const leadsRes = await getSellerLeads({ page: 1, limit: 20 });
        const mappedLeads: LeadItem[] = (leadsRes.leads || []).map((l: any) => ({
          id: l.id,
          customer: l.customer,
          customerName: l.customerName,
          type: l.type,
          service: l.service,
          status: l.status,
          createdAt: l.createdAt,
        }));
        setLeads(mappedLeads);
      } catch (err) {
        console.error('Failed to load seller leads:', err);
      }

      // Fetch initial offers
      try {
        const offersRes = await fetchSellerOffers();
        if (Array.isArray(offersRes)) {
          setOffers(offersRes);
        }
      } catch {
        // Ignore offer prefetch errors on initial load
      }

      // Fetch initial reviews if profile exists
      const targetProviderId = profData?.id || (profData as any)?._id;
      if (targetProviderId) {
        try {
          const revRes = await fetchProviderReviews(targetProviderId, 1, 20);
          setReviews(revRes.reviews || []);
          setTotalReviewsCount(revRes.summary?.totalReviews ?? revRes.reviews?.length ?? 0);
        } catch (err) {
          console.error('Failed to load seller reviews:', err);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        addToast(err.response?.data?.message || 'Failed to load seller dashboard', 'error');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadDashboardData();
    }
  }, [isAuthenticated, navigate, loadDashboardData]);

  // Real-time Lead Listener (INT-003)
  useEffect(() => {
    if (!socket || !profile?.id) return;

    const handleNewLead = (newLead: any) => {
      addToast(`🔔 New Lead: ${newLead.customerName || 'A customer'} contacted you via ${newLead.type}!`, 'info');
      setLeads((prev) => [
        {
          id: newLead.id || `lead_${Date.now()}`,
          customer: newLead.customer,
          customerName: newLead.customerName || 'New Customer',
          type: newLead.type || 'call',
          service: newLead.service || 'Service Request',
          status: 'new',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadLeadsCount((prev) => prev + 1);

      // Increment stats in place
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          totalLeads: prev.totalLeads + 1,
          callClicks: newLead.type === 'call' ? prev.callClicks + 1 : prev.callClicks,
          whatsappClicks: newLead.type === 'whatsapp' ? prev.whatsappClicks + 1 : prev.whatsappClicks,
        };
      });
    };

    const handleProfileViewed = (payload: { profileViews?: number }) => {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profileViews:
            typeof payload?.profileViews === 'number'
              ? payload.profileViews
              : prev.profileViews + 1,
        };
      });
    };

    const handleNewReview = (newReview: any) => {
      addToast(`⭐ New ${newReview.rating}★ review from ${newReview.customerName || 'a customer'}!`, 'info');
      loadDashboardData(true);
    };

    socket.on('newLead', handleNewLead);
    socket.on('profileViewed', handleProfileViewed);
    socket.on('newReview', handleNewReview);

    return () => {
      socket.off('newLead', handleNewLead);
      socket.off('profileViewed', handleProfileViewed);
      socket.off('newReview', handleNewReview);
    };
  }, [socket, profile?.id, addToast, loadDashboardData]);

  // Silently sync dashboard data when seller returns to the browser window/tab
  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return;
    const handleWindowFocus = () => {
      loadDashboardData(true);
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isAuthenticated, profile?.id, loadDashboardData]);

  const handleLiveToggled = (newLiveStatus: boolean) => {
    if (profile) {
      setProfile({ ...profile, isLive: newLiveStatus });
    }
    if (stats) {
      setStats({ ...stats, isLive: newLiveStatus });
    }
  };

  const handleLeadStatusUpdated = (leadId: string, newStatus: 'new' | 'contacted' | 'completed') => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
  };

  const handleCatalogueUpdated = (updatedServices: ProviderServiceItem[]) => {
    if (profile) {
      const startingPrice = updatedServices.length > 0
        ? Math.min(...updatedServices.map((s) => s.startingPrice))
        : profile.fromPrice;
      setProfile({
        ...profile,
        services: updatedServices,
        fromPrice: startingPrice,
      });
    }
  };

  const handleReplyAdded = (reviewId: string, replyText: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              sellerReply: replyText,
              sellerRepliedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const handleProfileUpdated = (updatedProfile: ProviderProfile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
          🏪
        </div>
        <h2 className="text-2xl font-bold text-ink mb-2">No Seller Account Found</h2>
        <p className="text-ink-muted mb-6">
          You have not registered as a service provider yet. Register today to reach hundreds of local customers!
        </p>
        <Button onClick={() => navigate('/register-seller')}>
          Register as Service Provider
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-ink">{profile.nameEn}</h1>
            <Badge
              variant={
                profile.status === 'approved'
                  ? 'success'
                  : profile.status === 'pending'
                  ? 'pending'
                  : 'closed'
              }
            >
              {profile.status === 'approved'
                ? 'Approved'
                : profile.status === 'pending'
                ? 'Pending Approval'
                : 'Rejected'}
            </Badge>
          </div>
          <p className="text-ink-muted text-sm mt-1">
            {profile.area} &bull; {profile.phone} &bull; Joined as Verified Merchant
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/providers/${profile.id}`)}
          >
            👁️ View Public Profile
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 py-4 border-b border-border-light">
        <button
          onClick={() => {
            handleTabChange('overview');
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          📊 Overview
        </button>

        <button
          onClick={() => {
            handleTabChange('leads');
            setUnreadLeadsCount(0);
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap relative ${
            activeTab === 'leads'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          📥 Leads Inbox
          {unreadLeadsCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
              {unreadLeadsCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('catalogue')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'catalogue'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          🛠️ Services & Pricing
        </button>

        <button
          onClick={() => handleTabChange('offers')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'offers'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          🔥 Service Offers
        </button>

        <button
          onClick={() => handleTabChange('reviews')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          ⭐ Customer Reviews ({totalReviewsCount !== null ? totalReviewsCount : reviews.length})
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          ⚙️ Business Profile
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === 'overview' && stats && (
          <SellerOverview
            profile={profile}
            stats={stats}
            onLiveToggled={handleLiveToggled}
          />
        )}

        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-ink">Inquiries & Leads</h2>
              <span className="text-sm text-ink-muted">
                Real-time updates enabled
              </span>
            </div>
            <LeadsTable leads={leads} onStatusUpdated={handleLeadStatusUpdated} />
          </div>
        )}

        {activeTab === 'catalogue' && (
          <div className="max-w-3xl">
            <CatalogueEditor
              initialServices={profile.services || []}
              onCatalogueUpdated={handleCatalogueUpdated}
            />
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="max-w-4xl">
            <SellerOffersManager
              services={profile.services || []}
              initialOffers={offers}
              onOffersUpdated={setOffers}
            />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="max-w-3xl">
            <ReviewsManager
              reviews={reviews}
              onReplyAdded={handleReplyAdded}
            />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl">
            <ProfileEditor
              profile={profile}
              onProfileUpdated={handleProfileUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
};
