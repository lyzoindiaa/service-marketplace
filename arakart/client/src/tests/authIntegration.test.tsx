import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/authService';

vi.mock('../services/authService');

describe('Auth Integration & Session Restore (INT-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
  });

  it('restores authenticated session on initAuth when refresh cookie is valid', async () => {
    vi.mocked(authService.refreshSession).mockResolvedValueOnce({
      accessToken: 'valid-restored-token',
    });

    vi.mocked(authService.fetchCurrentUser).mockResolvedValueOnce({
      user: {
        id: 'u123',
        name: 'Restored User',
        role: 'seller',
        authMethods: ['google'],
      },
    });

    await useAuthStore.getState().initAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.name).toBe('Restored User');
    expect(useAuthStore.getState().user?.role).toBe('seller');
    expect(useAuthStore.getState().accessToken).toBe('valid-restored-token');
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('gracefully sets unauthenticated state on initAuth when no refresh cookie exists', async () => {
    vi.mocked(authService.refreshSession).mockRejectedValueOnce(new Error('No token provided'));

    await useAuthStore.getState().initAuth();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('clears auth store when logout is called', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', name: 'Active User', role: 'customer', authMethods: ['email'] },
      'active-token'
    );

    vi.mocked(authService.logoutSession).mockResolvedValueOnce();

    await useAuthStore.getState().logout();

    expect(authService.logoutSession).toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
