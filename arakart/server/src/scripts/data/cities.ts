export interface CitySeedData {
  slug: string;
  nameEn: string;
  nameHi: string;
  stateEn: string;
  stateHi: string;
  isLive: boolean;
  defaultAreas: string[];
}

export const CITIES_SEED: CitySeedData[] = [
  {
    slug: 'ara',
    nameEn: 'Ara',
    nameHi: 'आरा',
    stateEn: 'Bihar',
    stateHi: 'बिहार',
    isLive: true,
    defaultAreas: [
      'Nawada',
      'Katira',
      'Gopali Chowk',
      'Pakri',
      'Anaith',
      'Station Road',
      'Babu Bazar',
      'Judge Bazar',
    ],
  },
  {
    slug: 'patna',
    nameEn: 'Patna',
    nameHi: 'पटना',
    stateEn: 'Bihar',
    stateHi: 'बिहार',
    isLive: false,
    defaultAreas: ['Kankarbagh', 'Boring Road', 'Bailey Road', 'Danapur', 'Rajendra Nagar'],
  },
  {
    slug: 'buxar',
    nameEn: 'Buxar',
    nameHi: 'बक्सर',
    stateEn: 'Bihar',
    stateHi: 'बिहार',
    isLive: false,
    defaultAreas: ['Station Road', 'Civil Lines', 'Golambar', 'Model Town'],
  },
];
