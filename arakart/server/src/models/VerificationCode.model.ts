import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export type VerificationChannel = 'phone' | 'email';
export type VerificationPurpose = 'login' | 'verify_email' | 'reset_password' | 'link' | 'seller_phone';

export interface IVerificationCode extends Document {
  _id: Types.ObjectId;
  channel: VerificationChannel;
  target: string;
  purpose: VerificationPurpose;
  codeHash: string;
  attempts: number;
  lastSentAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

const verificationCodeSchema = new Schema<IVerificationCode>(
  {
    channel: {
      type: String,
      enum: ['phone', 'email'],
      required: true,
      index: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['login', 'verify_email', 'reset_password', 'link', 'seller_phone'],
      required: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for querying specific verification flow
verificationCodeSchema.index({ channel: 1, target: 1, purpose: 1 });

verificationCodeSchema.plugin(toJSON);

export const VerificationCode = model<IVerificationCode>('VerificationCode', verificationCodeSchema);
