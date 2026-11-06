import { z } from 'zod';

export const searchProvidersSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  area: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  verifiedOnly: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        return val.toLowerCase() === 'true';
      }
      return val;
    }, z.boolean())
    .optional(),
  sort: z
    .enum(['rating', 'price', 'price_asc', 'price_desc', 'views', 'newest'])
    .optional()
    .default('rating'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});

export type SearchProvidersQuery = z.infer<typeof searchProvidersSchema>;
