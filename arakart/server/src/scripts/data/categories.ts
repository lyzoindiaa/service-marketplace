export interface CategorySeedData {
  slug: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  enabled: boolean;
}

export const CATEGORIES_SEED: CategorySeedData[] = [
  {
    slug: 'mechanic',
    nameEn: 'Mechanic',
    nameHi: 'मैकेनिक',
    icon: '🔧',
    enabled: true,
  },
  {
    slug: 'electrician',
    nameEn: 'Electrician',
    nameHi: 'इलेक्ट्रीशियन',
    icon: '💡',
    enabled: true,
  },
  {
    slug: 'plumber',
    nameEn: 'Plumber',
    nameHi: 'प्लंबर',
    icon: '🚰',
    enabled: true,
  },
  {
    slug: 'ac',
    nameEn: 'AC Repair',
    nameHi: 'AC रिपेयर',
    icon: '❄️',
    enabled: true,
  },
  {
    slug: 'cab',
    nameEn: 'Cab & Taxi',
    nameHi: 'कैब और टैक्सी',
    icon: '🚕',
    enabled: true,
  },
  {
    slug: 'carpenter',
    nameEn: 'Carpenter',
    nameHi: 'बढ़ई',
    icon: '🪚',
    enabled: true,
  },
  {
    slug: 'painter',
    nameEn: 'Painter',
    nameHi: 'पेंटर',
    icon: '🎨',
    enabled: true,
  },
  {
    slug: 'cleaning',
    nameEn: 'Home Cleaning',
    nameHi: 'घर की सफ़ाई',
    icon: '🧹',
    enabled: true,
  },
];
