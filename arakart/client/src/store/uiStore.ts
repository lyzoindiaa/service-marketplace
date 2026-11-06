import { create } from 'zustand';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UiState {
  authModalOpen: boolean;
  cityModalOpen: boolean;
  selectedCity: string;
  selectedCityName: string;
  selectedCityNameHi: string;
  selectedStateName: string;
  selectedStateNameHi: string;
  language: 'en' | 'hi';
  toasts: ToastMessage[];
  openAuthModal: () => void;
  closeAuthModal: () => void;
  openCityModal: () => void;
  closeCityModal: () => void;
  setCity: (city: string) => void;
  setCityDetails: (details: {
    slug: string;
    nameEn: string;
    nameHi?: string;
    stateEn?: string;
    stateHi?: string;
  }) => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  authModalOpen: false,
  cityModalOpen: false,
  selectedCity: 'all',
  selectedCityName: 'All Cities',
  selectedCityNameHi: 'सभी शहर',
  selectedStateName: 'India',
  selectedStateNameHi: 'भारत',
  language: 'en',
  toasts: [],
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  openCityModal: () => set({ cityModalOpen: true }),
  closeCityModal: () => set({ cityModalOpen: false }),
  setCity: (selectedCity) =>
    set({
      selectedCity,
      selectedCityName:
        selectedCity === 'all' || !selectedCity
          ? 'All Cities'
          : selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1),
    }),
  setCityDetails: (details) =>
    set({
      selectedCity: details.slug,
      selectedCityName: details.nameEn,
      selectedCityNameHi: details.nameHi || details.nameEn,
      selectedStateName: details.stateEn || 'India',
      selectedStateNameHi: details.stateHi || 'भारत',
      cityModalOpen: false,
    }),
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
