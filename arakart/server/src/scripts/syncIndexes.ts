import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import {
  User,
  Provider,
  VerificationCode,
  Review,
  Lead,
  Category,
  City,
  Report,
} from '../models';

export const syncAllIndexes = async (): Promise<void> => {
  const models = [
    { name: 'User', model: User },
    { name: 'Provider', model: Provider },
    { name: 'VerificationCode', model: VerificationCode },
    { name: 'Review', model: Review },
    { name: 'Lead', model: Lead },
    { name: 'Category', model: Category },
    { name: 'City', model: City },
    { name: 'Report', model: Report },
  ];

  logger.info('Starting index synchronization across all collections...');

  for (const item of models) {
    try {
      await item.model.syncIndexes();
      const indexes = await item.model.listIndexes();
      const indexNames = indexes.map((idx) => idx.name).join(', ');
      logger.info(`✓ [${item.name}] Synced ${indexes.length} indexes: ${indexNames}`);
    } catch (err: any) {
      logger.error(`✗ Error syncing indexes for [${item.name}]: ${err.message}`);
      throw err;
    }
  }

  logger.info('All database indexes successfully synchronized.');
};

if (require.main === module) {
  mongoose
    .connect(env.MONGO_URI)
    .then(async () => {
      await syncAllIndexes();
      await mongoose.disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Failed to sync database indexes:', err);
      process.exit(1);
    });
}
