import { z } from 'zod';

export const createReviewSchema = z.object({
  providerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid provider id format'),
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .trim()
    .min(3, 'Review comment must be at least 3 characters')
    .max(1000, 'Review comment cannot exceed 1000 characters'),
});

export const replyReviewSchema = z.object({
  reply: z
    .string()
    .trim()
    .min(2, 'Seller reply must be at least 2 characters')
    .max(1000, 'Seller reply cannot exceed 1000 characters'),
});
