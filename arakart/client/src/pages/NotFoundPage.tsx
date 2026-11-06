import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-black text-brand">404</h1>
      <p className="mt-4 text-xl font-bold text-ink">Page Not Found</p>
      <p className="mt-2 text-ink-muted">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-6 btn-primary">
        Back to Home
      </Link>
    </div>
  );
};
