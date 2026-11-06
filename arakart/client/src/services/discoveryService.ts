import api from '../lib/axios';

export interface CategoryItem {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  enabled?: boolean;
}

export interface CityItem {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  isLive: boolean;
}

export interface CityAreasResponse {
  city: string;
  slug: string;
  areas: string[];
}

export const fetchCategories = async (): Promise<CategoryItem[]> => {
  const res = await api.get('/categories');
  return res.data.data;
};

export const fetchCities = async (): Promise<CityItem[]> => {
  const res = await api.get('/cities');
  return res.data.data;
};

export const fetchCityAreas = async (slug: string = 'ara'): Promise<CityAreasResponse> => {
  const res = await api.get(`/cities/${slug}/areas`);
  return res.data.data;
};
