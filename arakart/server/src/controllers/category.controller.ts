import { Request, Response } from 'express';
import { discoveryService } from '../services/discovery.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeDisabled = req.query.all === 'true' && req.user?.role === 'admin';
    const categories = await discoveryService.getCategories(includeDisabled);
    sendSuccess(res, categories);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch categories', 500);
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nameEn, nameHi, slug, icon, enabled } = req.body;
    if (!nameEn || !nameHi || !slug || !icon) {
      sendError(res, 'nameEn, nameHi, slug, and icon are required', 400);
      return;
    }

    const category = await discoveryService.createCategory({
      nameEn,
      nameHi,
      slug,
      icon,
      enabled,
    });
    sendSuccess(res, category, 'Category created', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create category', 400);
  }
};

export const toggleCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await discoveryService.toggleCategory(id);
    if (!category) {
      sendError(res, 'Category not found', 404);
      return;
    }
    sendSuccess(res, category);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to toggle category', 500);
  }
};
