import { z } from 'zod';

export const createLeadSchema = z.object({
  providerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid provider id format'),
  type: z.enum(['call', 'whatsapp']),
  service: z.string().optional(),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'completed']),
});
