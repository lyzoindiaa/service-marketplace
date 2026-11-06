import api from '../lib/axios';

export interface ProviderSearchParams {
  q?: string;
  category?: string;
  city?: string;
  area?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  sort?: 'rating' | 'price' | 'price_asc' | 'price_desc' | 'views' | 'newest';
  page?: number;
  limit?: number;
}

export interface ProviderServiceItem {
  id?: string;
  nameEn: string;
  nameHi?: string;
  startingPrice: number;
}

export interface ProviderProfile {
  id: string;
  nameEn: string;
  nameHi?: string;
  categories: string[];
  area: string;
  areasServed: string[];
  city: string;
  phone: string;
  whatsapp?: string;
  bioEn?: string;
  bioHi?: string;
  experience?: number;
  workingHours?: string;
  isAllDay: boolean;
  services: ProviderServiceItem[];
  photos: string[];
  avgRating: number;
  reviewCount: number;
  profileViews: number;
  callClicks: number;
  whatsappClicks: number;
  status: string;
  isLive: boolean;
  verified: boolean;
  fromPrice: number;
}

export interface ProviderSearchResponse {
  providers: ProviderProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const searchProviders = async (
  params: ProviderSearchParams
): Promise<ProviderSearchResponse> => {
  const res = await api.get('/providers', { params });
  return res.data.data;
};

export const getProviderById = async (id: string): Promise<ProviderProfile> => {
  const res = await api.get(`/providers/${id}`);
  return res.data.data;
};

export interface PublicStatsResponse {
  verifiedProvidersCount: number;
  categoriesCount: number;
  avgRating: number;
  totalReviews: number;
  recentReviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    sellerReply?: string;
    providerId: string;
    providerNameEn: string;
    providerNameHi?: string;
    providerArea?: string;
    createdAt: string;
  }>;
}

export const fetchPublicStats = async (city?: string): Promise<PublicStatsResponse> => {
  const res = await api.get('/providers/public-stats', {
    params: city ? { city } : undefined,
  });
  return res.data.data;
};
