import { Request, Response } from 'express';
import { providerService } from '../services/provider.service';
import { searchProvidersSchema } from '../validators/provider.validators';
import { sendSuccess, sendError } from '../utils/responseHelper';

export const getProviders = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = searchProvidersSchema.safeParse(req.query);
    if (!parseResult.success) {
      sendError(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR', parseResult.error.errors);
      return;
    }

    const result = await providerService.searchProviders(parseResult.data);
    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to search providers', error.statusCode || 500);
  }
};

export const getProviderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const provider = await providerService.getProviderById(id);

    if (!provider) {
      sendError(res, 'Provider not found', 404);
      return;
    }

    sendSuccess(res, provider);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch provider profile', error.statusCode || 500);
  }
};

export const getPublicStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const stats = await providerService.getPublicStats(city);
    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch public platform stats', 500);
  }
};
