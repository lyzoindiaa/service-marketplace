import { Schema } from 'mongoose';

/**
 * Mongoose plugin that removes __v, and deletes sensitive fields on toJSON
 */
export const toJSON = (schema: Schema) => {
  schema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: Record<string, any>) => {
      delete ret.__v;
      delete ret.passwordHash;
      delete ret.refreshTokenHash;
      delete ret.codeHash;
      return ret;
    },
  });
};
