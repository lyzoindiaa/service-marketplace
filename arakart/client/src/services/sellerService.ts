import api from '../lib/axios';
import { ProviderProfile, ProviderServiceItem } from './providerService';

export interface RequestedCategoryPayload {
  nameEn: string;
  nameHi?: string;
  description?: string;
}

export interface ApplySellerPayload {
  nameEn: string;
  nameHi?: string;
  email?: string;
  categories: string[];
  requestedCategory?: RequestedCategoryPayload;
  city?: string;
  area: string;
  areasServed?: string[];
  phone: string;
  whatsapp?: string;
  bioEn?: string;
  bioHi?: string;
  experience?: number;
  workingHours?: string;
  isAllDay?: boolean;
  services: ProviderServiceItem[];
  photos?: string[];
}

export interface SellerStatsResponse {
  profileViews: number;
  callClicks: number;
  whatsappClicks: number;
  avgRating: number;
  reviewCount: number;
  totalLeads: number;
  status: 'pending' | 'approved' | 'rejected';
  isLive: boolean;
}

export const applySeller = async (
  payload: ApplySellerPayload
): Promise<ProviderProfile> => {
  const res = await api.post('/sellers/apply', payload);
  return res.data.data;
};

export const getMySellerProfile = async (): Promise<ProviderProfile> => {
  const res = await api.get('/sellers/me');
  return res.data.data;
};

export const updateSellerProfile = async (
  payload: Partial<ApplySellerPayload>
): Promise<ProviderProfile> => {
  const res = await api.put('/sellers/me/profile', payload);
  return res.data.data;
};

export const updateSellerCatalogue = async (
  services: ProviderServiceItem[]
): Promise<ProviderProfile> => {
  const res = await api.put('/sellers/me/catalogue', { services });
  return res.data.data;
};

export const toggleSellerLive = async (): Promise<ProviderProfile> => {
  const res = await api.put('/sellers/me/toggle-live');
  return res.data.data;
};

export const uploadSellerPhoto = async (file: File): Promise<{ photos: string[] }> => {
  const formData = new FormData();
  formData.append('photo', file);
  const res = await api.post('/sellers/me/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const deleteSellerPhoto = async (photoUrl: string): Promise<{ photos: string[] }> => {
  const res = await api.delete('/sellers/me/photos', { data: { photoUrl } });
  return res.data.data;
};

export const getSellerStats = async (): Promise<SellerStatsResponse> => {
  const res = await api.get('/sellers/me/stats');
  return res.data.data;
};
