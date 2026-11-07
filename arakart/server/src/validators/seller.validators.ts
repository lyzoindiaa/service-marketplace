import { z } from 'zod';

export const serviceItemSchema = z.object({
  nameEn: z.string().trim().min(2, 'Service name must be at least 2 characters'),
  nameHi: z.string().trim().optional(),
  startingPrice: z.number().min(0, 'Starting price cannot be negative'),
});

export const requestedCategorySchema = z.object({
  nameEn: z.string().trim().min(2, 'Category name must be at least 2 characters'),
  nameHi: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export const applySellerSchema = z
  .object({
    nameEn: z.string().trim().min(3, 'Business name must be at least 3 characters').max(100),
    nameHi: z.string().trim().max(100).optional(),
    email: z.string().trim().email('Valid email address required').optional(),
    categories: z.array(z.string()).optional().default([]),
    requestedCategory: requestedCategorySchema.optional(),
    city: z.string().trim().optional(),
    cityName: z.string().trim().optional(),
    state: z.string().trim().optional(),
    area: z.string().trim().min(2, 'Primary area locality is required'),
    areasServed: z.array(z.string().trim()).optional(),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required'),
    whatsapp: z.union([z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit WhatsApp number required'), z.literal('')]).optional(),
    bioEn: z.string().trim().max(1000).optional(),
    bioHi: z.string().trim().max(1000).optional(),
    experience: z.number().int().min(0).max(60).optional(),
    workingHours: z.string().trim().max(100).optional(),
    isAllDay: z.boolean().optional(),
    services: z.array(serviceItemSchema).min(1, 'Please provide at least 1 service in your catalogue'),
    photos: z.array(z.string().url()).max(10).optional(),
  })
  .refine(
    (data) =>
      (data.categories && data.categories.length > 0) ||
      Boolean(data.requestedCategory && data.requestedCategory.nameEn.trim().length >= 2),
    {
      message: 'Please select at least 1 category or suggest a new category',
      path: ['categories'],
    }
  );

export const updateProfileSchema = z.object({
  nameEn: z.string().trim().min(3).max(100).optional(),
  nameHi: z.string().trim().max(100).optional(),
  categories: z.array(z.string()).min(1, 'Please select at least 1 category').optional(),
  city: z.string().trim().optional(),
  area: z.string().trim().min(2).optional(),
  areasServed: z.array(z.string().trim()).optional(),
  whatsapp: z.union([z.string().regex(/^[6-9]\d{9}$/), z.literal('')]).optional(),
  bioEn: z.string().trim().max(1000).optional(),
  bioHi: z.string().trim().max(1000).optional(),
  experience: z.number().int().min(0).max(60).optional(),
  workingHours: z.string().trim().max(100).optional(),
  isAllDay: z.boolean().optional(),
});

export const updateCatalogueSchema = z.object({
  services: z.array(serviceItemSchema).min(1, 'Please provide at least 1 service in your catalogue'),
});
