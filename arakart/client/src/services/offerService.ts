import api from '../lib/axios';

export type OfferScheduleType = 'date_range' | 'single_day_slot';
export type OfferComputedStatus = 'live_now' | 'upcoming' | 'expired';

export interface OfferSellerSummary {
  id: string;
  nameEn: string;
  nameHi: string;
  area: string;
  city: string;
  category: string;
  phone?: string;
  rating: number;
  photoUrl: string;
  isVerified: boolean;
}

export interface OfferAppliedCustomer {
  applicationId: string;
  claimCode: string;
  status: string;
  appliedAt: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null;
}

export interface OfferItem {
  id: string;
  seller: OfferSellerSummary | null;
  serviceId: string;
  serviceTitleEn: string;
  serviceTitleHi: string;
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  scheduleType: OfferScheduleType;
  startDate: string | null;
  endDate: string | null;
  workHoursStart: string | null;
  workHoursEnd: string | null;
  singleDate: string | null;
  slotStartHour: string | null;
  slotEndHour: string | null;
  city: string;
  isActive: boolean;
  claimsCount: number;
  computedStatus: OfferComputedStatus;
  hasCustomerApplied?: boolean;
  appliedCustomers?: OfferAppliedCustomer[];
  createdAt: string;
}

export interface AppliedOfferItem {
  id: string;
  claimCode: string;
  status: 'applied' | 'redeemed' | 'expired';
  appliedAt: string;
  serviceTitleEn: string;
  serviceTitleHi: string;
  offerPrice: number;
  originalPrice: number;
  discountPercent: number;
  offer: {
    id: string;
    titleEn: string;
    titleHi: string;
    scheduleType: OfferScheduleType;
    startDate: string | null;
    endDate: string | null;
    workHoursStart: string | null;
    workHoursEnd: string | null;
    singleDate: string | null;
    slotStartHour: string | null;
    slotEndHour: string | null;
    computedStatus: OfferComputedStatus;
  } | null;
  seller: {
    id: string;
    nameEn: string;
    nameHi: string;
    area: string;
    city: string;
    category: string;
    phone: string;
    photoUrl: string;
  } | null;
}

export interface CreateSellerOfferPayload {
  serviceId?: string;
  serviceTitleEn: string;
  serviceTitleHi?: string;
  originalPrice: number;
  offerPrice: number;
  titleEn: string;
  titleHi?: string;
  descriptionEn?: string;
  descriptionHi?: string;
  scheduleType: OfferScheduleType;
  startDate?: string;
  endDate?: string;
  workHoursStart?: string;
  workHoursEnd?: string;
  singleDate?: string;
  slotStartHour?: string;
  slotEndHour?: string;
}

export const fetchPublicOffers = async (params?: {
  city?: string;
  category?: string;
  sellerId?: string;
  scheduleType?: string;
}): Promise<OfferItem[]> => {
  const res = await api.get('/offers', { params });
  return res.data.data.offers || [];
};

export const applyOffer = async (
  offerId: string
): Promise<{
  alreadyApplied: boolean;
  application: {
    id: string;
    claimCode: string;
    status: string;
    appliedAt: string;
    serviceTitleEn: string;
    serviceTitleHi: string;
    offerPrice: number;
    originalPrice: number;
    discountPercent: number;
    sellerName: string;
    sellerPhone: string;
    sellerArea: string;
  };
}> => {
  const res = await api.post(`/offers/${offerId}/apply`);
  return res.data.data;
};

export const fetchMyAppliedOffers = async (): Promise<AppliedOfferItem[]> => {
  const res = await api.get('/offers/my-applied');
  return res.data.data.appliedOffers || [];
};

export const fetchSellerOffers = async (): Promise<OfferItem[]> => {
  const res = await api.get('/offers/seller');
  return res.data.data.offers || [];
};

export const createSellerOffer = async (payload: CreateSellerOfferPayload): Promise<OfferItem> => {
  const res = await api.post('/offers/seller', payload);
  return res.data.data;
};

export const updateSellerOffer = async (
  offerId: string,
  payload: Partial<CreateSellerOfferPayload & { isActive: boolean }>
): Promise<OfferItem> => {
  const res = await api.put(`/offers/seller/${offerId}`, payload);
  return res.data.data;
};

export const deleteSellerOffer = async (offerId: string): Promise<void> => {
  await api.delete(`/offers/seller/${offerId}`);
};

export const fetchAdminOffers = async (params?: {
  city?: string;
  scheduleType?: string;
}): Promise<OfferItem[]> => {
  const res = await api.get('/offers/admin', { params });
  return res.data.data.offers || [];
};
