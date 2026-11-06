import api from '../lib/axios';
import { ProviderProfile, ProviderServiceItem } from './providerService';

export interface ApplySellerPayload {
  nameEn: string;
  nameHi?: string;
  categories: string[];
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

export const getSellerStats = async (): Promise<SellerStatsResponse> => {
  const res = await api.get('/sellers/me/stats');
  return res.data.data;
};
