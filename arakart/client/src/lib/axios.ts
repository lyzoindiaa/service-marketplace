import axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Silent Refresh & 403 Suspended User
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;

    // 1. Handle Account Suspension (403)
    if (error?.response?.status === 403) {
      const errorMsg: string = error.response.data?.error || '';
      if (
        errorMsg.toLowerCase().includes('suspended') ||
        error.response.data?.code === 'USER_SUSPENDED'
      ) {
        useAuthStore.getState().clearAuth();
        useUiStore.getState().addToast(
          errorMsg || 'Your account has been suspended. Please contact support.',
          'error'
        );
      }
      return Promise.reject(error);
    }

    // 2. Handle Unauthorized (401)
    if (error?.response?.status === 401 && originalRequest) {
      const url = originalRequest.url || '';

      // Don't loop on refresh or logout endpoints
      if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      // If user wasn't authenticated with an access token, don't attempt silent refresh
      if (!useAuthStore.getState().accessToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      // If already retried once, reject
      if (originalRequest._retry) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      // If refresh is already in-flight, enqueue this request
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api.request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        const refreshedUser = refreshResponse.data.user;

        if (refreshedUser) {
          useAuthStore.getState().setAuth(refreshedUser, newAccessToken);
        } else {
          useAuthStore.getState().setToken(newAccessToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api.request(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clearAuth();
        // Reject with the original request's error so the UI shows the real cause rather than an internal refresh token error
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const setupAxiosInterceptors = () => api;

export default api;
