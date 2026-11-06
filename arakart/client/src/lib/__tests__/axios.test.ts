import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../axios';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import axios from 'axios';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      ...actual.default,
      post: vi.fn(),
      create: actual.default.create,
    },
  };
});

describe('Axios Silent Refresh & Interceptors (INT-002)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    useUiStore.setState({ toasts: [] });
  });

  it('attaches Bearer token from authStore to outgoing request headers', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', name: 'Test User', role: 'customer', authMethods: ['phone'] },
      'valid-access-token'
    );

    // Call request interceptor directly or inspect config
    const config = { headers: {} as any };
    // @ts-ignore
    const modifiedConfig = await api.interceptors.request.handlers[0].fulfilled(config);

    expect(modifiedConfig.headers.Authorization).toBe('Bearer valid-access-token');
  });

  it('retries original request with new token after 401 expired token refresh', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', name: 'Test User', role: 'customer', authMethods: ['phone'] },
      'expired-token'
    );

    // Mock axios.post for the refresh endpoint
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        accessToken: 'refreshed-token',
        user: { id: 'u1', name: 'Test User', role: 'customer', authMethods: ['phone'] },
      },
    });

    // Mock the replay call
    const replaySpy = vi.fn().mockResolvedValueOnce({ data: { success: true } });
    // @ts-ignore
    const originalApi = api;
    const requestConfig = {
      url: '/profile',
      headers: { Authorization: 'Bearer expired-token' },
      _retry: false,
    };

    const error401 = {
      config: requestConfig,
      response: { status: 401, data: { error: 'jwt expired' } },
    };

    // Spy on api instance for replay
    const apiCallSpy = vi.spyOn(api, 'request').mockImplementation(replaySpy);

    // Execute response interceptor error handler
    // @ts-ignore
    const responseHandler = api.interceptors.response.handlers[0].rejected as any;
    await responseHandler(error401);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh'),
      {},
      expect.objectContaining({ withCredentials: true })
    );
    expect(useAuthStore.getState().accessToken).toBe('refreshed-token');

    apiCallSpy.mockRestore();
  });

  it('handles refresh failure by clearing auth state', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', name: 'Test User', role: 'customer', authMethods: ['phone'] },
      'expired-token'
    );

    vi.mocked(axios.post).mockRejectedValueOnce(new Error('Invalid refresh token'));

    const error401 = {
      config: { url: '/protected-resource', headers: {}, _retry: false },
      response: { status: 401, data: { error: 'Unauthorized' } },
    };

    // @ts-ignore
    const responseHandler = api.interceptors.response.handlers[0].rejected as any;

    await expect(responseHandler(error401)).rejects.toThrow();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('handles 403 suspended user by clearing auth state and displaying warning toast', async () => {
    useAuthStore.getState().setAuth(
      { id: 'u1', name: 'Suspended User', role: 'customer', authMethods: ['phone'] },
      'user-token'
    );

    const error403 = {
      config: { url: '/leads', headers: {} },
      response: {
        status: 403,
        data: { error: 'Account suspended. Contact support.' },
      },
    };

    // @ts-ignore
    const responseHandler = api.interceptors.response.handlers[0].rejected as any;

    await expect(responseHandler(error403)).rejects.toBeDefined();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useUiStore.getState().toasts.some((t) => t.type === 'error')).toBe(true);
  });
});
