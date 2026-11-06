import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import {
  fetchAdminDashboardStats,
  fetchPendingSellers,
  fetchAdminUsers,
  fetchAdminReports,
  fetchAdminActivity,
  AdminDashboardStats,
  AdminUserItem,
  AdminReportItem,
  AdminActivityItem,
} from '../services/adminService';
import {
  fetchCategories,
  fetchCities,
  CategoryItem,
  CityItem,
} from '../services/discoveryService';
import { Spinner } from '../components/common/Spinner';
import { AdminKpiStrip } from '../components/admin/AdminKpiStrip';
import { PendingApprovals } from '../components/admin/PendingApprovals';
import { UserManagement } from '../components/admin/UserManagement';
import { CategoryCityManager } from '../components/admin/CategoryCityManager';
import { ReportsManager } from '../components/admin/ReportsManager';
import { ActivityFeed } from '../components/admin/ActivityFeed';
import { AdminBlogsManager } from '../components/admin/AdminBlogsManager';
import { AdminOffersManager } from '../components/admin/AdminOffersManager';

type AdminTab = 'overview' | 'pending' | 'users' | 'categories' | 'blogs' | 'offers' | 'reports';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useUiStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [activity, setActivity] = useState<AdminActivityItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        statsData,
        pendingData,
        usersData,
        reportsData,
        actData,
        catsData,
        citiesData,
      ] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchPendingSellers(),
        fetchAdminUsers(),
        fetchAdminReports(),
        fetchAdminActivity(),
        fetchCategories(),
        fetchCities(),
      ]);

      setStats(statsData);
      setPendingSellers(pendingData.sellers || []);
      setUsers(usersData.users || []);
      setReports(reportsData.reports || []);
      setActivity(actData.activity || []);
      setCategories(catsData);
      setCities(citiesData);
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load admin console', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [isAuthenticated, user?.role, navigate, loadAdminData]);

  const handlePendingActionComplete = () => {
    loadAdminData();
  };

  const handleUserUpdated = (userId: string, newSuspended: boolean) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, suspended: newSuspended } : u))
    );
  };

  const handleReportResolved = (reportId: string, newStatus: 'resolved' | 'dismissed') => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-light">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-ink">AraKart Admin Console</h1>
            <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full font-bold">
              Platform Master
            </span>
          </div>
          <p className="text-ink-muted text-sm mt-1">
            Platform governance, seller approvals, and marketplace telemetry.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      {stats && (
        <div className="mt-6">
          <AdminKpiStrip stats={stats} />
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 py-4 mt-6 border-b border-border-light">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          📊 Overview
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap relative ${
            activeTab === 'pending'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          ⏳ Pending Approvals
          {pendingSellers.length > 0 && (
            <span className="ml-1.5 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingSellers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          👥 User Management
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          🛠️ Categories & Cities
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'offers'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          🔥 Seller Offers
        </button>

        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'blogs'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          📰 Blogs Manager
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap relative ${
            activeTab === 'reports'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-ink-muted hover:text-ink hover:bg-slate-100'
          }`}
        >
          🛡️ Abuse Reports
          {reports.filter((r) => r.status === 'open').length > 0 && (
            <span className="ml-1.5 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {reports.filter((r) => r.status === 'open').length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-2">Marketplace Summary</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  AraKart operates across multiple cities and states with active service categories and verified local providers.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-center">
                  <div>
                    <span className="text-xl font-bold text-slate-900">{stats?.totalCategories}</span>
                    <p className="text-[11px] text-slate-400">Categories</p>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900">{stats?.totalCities}</span>
                    <p className="text-[11px] text-slate-400">Launch City</p>
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-900">{stats?.totalReviews}</span>
                    <p className="text-[11px] text-slate-400">Verified Reviews</p>
                  </div>
                </div>
              </div>

              {pendingSellers.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">Urgent: Pending Approvals</h3>
                    <button
                      onClick={() => setActiveTab('pending')}
                      className="text-xs font-semibold text-brand-primary hover:underline"
                    >
                      View All ({pendingSellers.length})
                    </button>
                  </div>
                  <PendingApprovals
                    sellers={pendingSellers.slice(0, 2)}
                    onActionComplete={handlePendingActionComplete}
                  />
                </div>
              )}
            </div>

            <div>
              <ActivityFeed activity={activity} />
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <PendingApprovals
            sellers={pendingSellers}
            onActionComplete={handlePendingActionComplete}
          />
        )}

        {activeTab === 'users' && (
          <UserManagement users={users} onUserUpdated={handleUserUpdated} />
        )}

        {activeTab === 'categories' && (
          <CategoryCityManager
            categories={categories}
            cities={cities}
            onRefresh={loadAdminData}
          />
        )}

        {activeTab === 'offers' && <AdminOffersManager />}

        {activeTab === 'blogs' && <AdminBlogsManager />}

        {activeTab === 'reports' && (
          <ReportsManager
            reports={reports}
            onReportResolved={handleReportResolved}
          />
        )}
      </div>
    </div>
  );
};
