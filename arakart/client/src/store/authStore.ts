import { create } from 'zustand';
import { User } from '../types';
import { refreshSession, fetchCurrentUser, logoutSession } from '../services/authService';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setToken: (accessToken: string) => void;
  setFavourites: (favourites: string[]) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  setToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
  setFavourites: (favourites) =>
    set((state) => ({
      user: state.user ? { ...state.user, favourites } : null,
    })),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
  initAuth: async () => {
    set({ isLoading: true });
    try {
      const { accessToken } = await refreshSession();
      set({ accessToken, isAuthenticated: true });
      const { user } = await fetchCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: async () => {
    try {
      await logoutSession();
    } finally {
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },
}));
