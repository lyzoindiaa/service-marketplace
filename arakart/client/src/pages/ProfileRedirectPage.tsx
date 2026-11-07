import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { Spinner } from '../components/common/Spinner';

export const ProfileRedirectPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { openAuthModal } = useUiStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      navigate('/', { replace: true });
      openAuthModal();
      return;
    }

    if (user.role === 'seller') {
      navigate('/seller/dashboard?tab=profile', { replace: true });
    } else if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/favourites', { replace: true });
    }
  }, [isAuthenticated, user, isLoading, navigate, openAuthModal]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
};
