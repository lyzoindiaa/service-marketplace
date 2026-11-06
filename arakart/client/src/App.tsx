import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { PrivateRoute } from './components/routing/PrivateRoute';
import { Layout } from './components/layout';
import { Spinner } from './components/common/Spinner';

import { HomePage } from './pages/HomePage';

// Lazy-loaded pages for high performance code-splitting (FE-012)
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage').then((m) => ({ default: m.SearchResultsPage })));
const ProviderProfilePage = lazy(() => import('./pages/ProviderProfilePage').then((m) => ({ default: m.ProviderProfilePage })));
const SellerRegisterPage = lazy(() => import('./pages/SellerRegisterPage').then((m) => ({ default: m.SellerRegisterPage })));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage').then((m) => ({ default: m.SellerDashboardPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const CustomerFavouritesPage = lazy(() => import('./pages/CustomerFavouritesPage').then((m) => ({ default: m.CustomerFavouritesPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export const App: React.FC = () => {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/provider/:id" element={<ProviderProfilePage />} />
            <Route path="/register-seller" element={<SellerRegisterPage />} />

            {/* Customer routes */}
            <Route
              path="/favourites"
              element={
                <PrivateRoute allowedRoles={['customer', 'seller', 'admin']}>
                  <CustomerFavouritesPage />
                </PrivateRoute>
              }
            />

            {/* Protected Seller dashboard */}
            <Route
              path="/seller/dashboard"
              element={
                <PrivateRoute allowedRoles={['seller', 'admin']}>
                  <SellerDashboardPage />
                </PrivateRoute>
              }
            />

            {/* Protected Admin dashboard */}
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </PrivateRoute>
              }
            />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
