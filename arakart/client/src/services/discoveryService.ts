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
  stateEn?: string;
  stateHi?: string;
  isLive: boolean;
  defaultAreas?: string[];
}

export interface CityAreasResponse {
  city: string;
  cityHi?: string;
  state?: string;
  stateHi?: string;
  slug: string;
  areas: string[];
}

const CACHE_TTL_MS = 60_000;
const isTestEnv = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

let categoriesCache: { data: CategoryItem[]; expiresAt: number } | null = null;
let categoriesInFlight: Promise<CategoryItem[]> | null = null;

let citiesCache: { data: CityItem[]; expiresAt: number } | null = null;
let citiesInFlight: Promise<CityItem[]> | null = null;

const areasCache = new Map<string, { data: CityAreasResponse; expiresAt: number }>();

export const clearDiscoveryCache = (): void => {
  categoriesCache = null;
  categoriesInFlight = null;
  citiesCache = null;
  citiesInFlight = null;
  areasCache.clear();
};

export const fetchCategories = async (): Promise<CategoryItem[]> => {
  if (!isTestEnv && categoriesCache && Date.now() < categoriesCache.expiresAt) {
    return categoriesCache.data;
  }
  if (!isTestEnv && categoriesInFlight) {
    return categoriesInFlight;
  }

  const req = api.get('/categories').then((res) => {
    const data = res.data.data;
    if (!isTestEnv) {
      categoriesCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      categoriesInFlight = null;
    }
    return data;
  });

  if (!isTestEnv) {
    categoriesInFlight = req;
    req.catch(() => {
      categoriesInFlight = null;
    });
  }
  return req;
};

export const fetchCities = async (): Promise<CityItem[]> => {
  if (!isTestEnv && citiesCache && Date.now() < citiesCache.expiresAt) {
    return citiesCache.data;
  }
  if (!isTestEnv && citiesInFlight) {
    return citiesInFlight;
  }

  const req = api.get('/cities').then((res) => {
    const data = res.data.data;
    if (!isTestEnv) {
      citiesCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      citiesInFlight = null;
    }
    return data;
  });

  if (!isTestEnv) {
    citiesInFlight = req;
    req.catch(() => {
      citiesInFlight = null;
    });
  }
  return req;
};

export const fetchCityAreas = async (slug: string = 'all'): Promise<CityAreasResponse> => {
  const key = slug.toLowerCase().trim();
  const cached = areasCache.get(key);
  if (!isTestEnv && cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const res = await api.get(`/cities/${key}/areas`);
  const data = res.data.data;
  if (!isTestEnv) {
    areasCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  return data;
};
