import api from '../lib/axios';

export interface ReviewItemData {
  id: string;
  provider: string;
  customer: string;
  customerName: string;
  rating: number;
  comment: string;
  sellerReply?: string | null;
  sellerRepliedAt?: string | null;
  createdAt: string;
}

export interface ProviderReviewsResponse {
  reviews: ReviewItemData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    avgRating: number;
    totalReviews: number;
    breakdown: Record<string, number>;
  };
}

export interface SubmitReviewPayload {
  providerId: string;
  rating: number;
  comment: string;
}

export const fetchProviderReviews = async (
  providerId: string,
  page: number = 1,
  limit: number = 10
): Promise<ProviderReviewsResponse> => {
  const res = await api.get(`/reviews/provider/${providerId}`, {
    params: { page, limit },
  });
  return res.data.data;
};

export const submitReview = async (
  payload: SubmitReviewPayload
): Promise<ReviewItemData> => {
  const res = await api.post('/reviews', payload);
  return res.data.data;
};

export const replyToReview = async (
  reviewId: string,
  reply: string
): Promise<ReviewItemData> => {
  const res = await api.patch(`/reviews/${reviewId}/reply`, { reply });
  return res.data.data;
};
