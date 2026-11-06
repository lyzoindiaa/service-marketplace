import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastContainer } from '../common/Toast';
import { AuthModal } from '../auth';
import { OfflineBanner } from '../common/OfflineBanner';

export interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <OfflineBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ToastContainer />
      <AuthModal />
    </div>
  );
};
