import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  authModalOpen: boolean;
  selectedCity: string;
  language: 'en' | 'hi';
  toasts: ToastMessage[];
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setCity: (city: string) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  authModalOpen: false,
  selectedCity: 'ara',
  language: 'en',
  toasts: [],
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setCity: (selectedCity) => set({ selectedCity }),
  setLanguage: (language) => set({ language }),
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
