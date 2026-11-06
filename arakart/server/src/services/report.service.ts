import mongoose from 'mongoose';
import { Report, IReport } from '../models/Report.model';
import { Provider } from '../models/Provider.model';

export class ReportService {
  async createReport(
    reportedBy: string,
    providerId: string,
    reason: string,
    details?: string
  ): Promise<IReport> {
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      const error: any = new Error('Invalid provider id');
      error.statusCode = 400;
      throw error;
    }

    if (!reason || !reason.trim()) {
      const error: any = new Error('Report reason is required');
      error.statusCode = 400;
      throw error;
    }

    const provider = await Provider.findById(providerId);
    if (!provider) {
      const error: any = new Error('Provider not found');
      error.statusCode = 404;
      throw error;
    }

    const report = new Report({
      provider: provider._id,
      reportedBy,
      reason: reason.trim(),
      adminNote: details || null,
      status: 'open',
    });

    return report.save();
  }
}

export const reportService = new ReportService();
