import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { ProviderProfilePage } from './pages/ProviderProfilePage';
import { SellerRegisterPage } from './pages/SellerRegisterPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CustomerFavouritesPage } from './pages/CustomerFavouritesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivateRoute } from './components/routing/PrivateRoute';
import { Layout } from './components/layout';

export const App: React.FC = () => {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Layout>
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
      </Layout>
    </BrowserRouter>
  );
};

export default App;
