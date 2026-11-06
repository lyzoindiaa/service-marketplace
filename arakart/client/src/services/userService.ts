import api from '../lib/axios';
import { ProviderProfile } from './providerService';

export interface FavouritesResponse {
  favourites: string[];
  message: string;
}

export interface ReportPayload {
  providerId: string;
  reason: string;
  details?: string;
}

export const getFavourites = async (): Promise<ProviderProfile[]> => {
  const res = await api.get('/users/me/favourites');
  return res.data.data;
};

export const addFavourite = async (providerId: string): Promise<FavouritesResponse> => {
  const res = await api.post(`/users/me/favourites/${providerId}`);
  return res.data.data;
};

export const removeFavourite = async (providerId: string): Promise<FavouritesResponse> => {
  const res = await api.delete(`/users/me/favourites/${providerId}`);
  return res.data.data;
};

export const submitReport = async (payload: ReportPayload): Promise<any> => {
  const res = await api.post('/reports', payload);
  return res.data.data;
};
