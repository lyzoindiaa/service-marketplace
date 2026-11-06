import { Request, Response } from 'express';
import { discoveryService } from '../services/discovery.service';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getCities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const cities = await discoveryService.getCities();
    sendSuccess(res, cities);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch cities', 500);
  }
};

export const getCityAreas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const result = await discoveryService.getCityAreas(slug);
    if (!result) {
      sendError(res, `City not found with slug: ${slug}`, 404);
      return;
    }
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to aggregate city areas', 500);
  }
};

export const createCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nameEn, nameHi, slug, isLive } = req.body;
    if (!nameEn || !nameHi || !slug) {
      sendError(res, 'nameEn, nameHi, and slug are required', 400);
      return;
    }

    const city = await discoveryService.createCity({
      nameEn,
      nameHi,
      slug,
      isLive,
    });
    sendSuccess(res, city, 'City created', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create city', 400);
  }
};

export const toggleCity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const city = await discoveryService.toggleCity(id);
    if (!city) {
      sendError(res, 'City not found', 404);
      return;
    }
    sendSuccess(res, city);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to toggle city', 500);
  }
};
