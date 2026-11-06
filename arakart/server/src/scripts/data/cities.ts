export interface CitySeedData {
  slug: string;
  nameEn: string;
  nameHi: string;
  isLive: boolean;
}

export const CITIES_SEED: CitySeedData[] = [
  {
    slug: 'ara',
    nameEn: 'Ara',
    nameHi: 'आरा',
    isLive: true,
  },
  {
    slug: 'patna',
    nameEn: 'Patna',
    nameHi: 'पटना',
    isLive: false,
  },
  {
    slug: 'buxar',
    nameEn: 'Buxar',
    nameHi: 'बक्सर',
    isLive: false,
  },
];
