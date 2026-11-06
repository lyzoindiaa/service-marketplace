export type UserRole = 'customer' | 'seller' | 'admin';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  authMethods: string[];
  sellerId?: string | null;
  favourites?: string[];
  suspended?: boolean;
}

export interface ServiceItem {
  _id?: string;
  nameEn: string;
  nameHi?: string;
  startingPrice: number;
}

export interface Provider {
  _id: string;
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
  isAllDay?: boolean;
  services: ServiceItem[];
  photos: string[];
  avgRating: number;
  reviewCount: number;
  fromPrice: number;
  verified: boolean;
  isLive: boolean;
  isOpen?: boolean;
}

export interface Category {
  _id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  icon: string;
  enabled: boolean;
}

export interface City {
  _id: string;
  nameEn: string;
  nameHi: string;
  slug: string;
  isLive: boolean;
}
