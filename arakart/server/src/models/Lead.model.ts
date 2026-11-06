import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export type LeadType = 'call' | 'whatsapp';
export type LeadStatus = 'new' | 'contacted' | 'completed';

export interface ILead extends Document {
  _id: Types.ObjectId;
  provider: Types.ObjectId;
  customer?: Types.ObjectId | null;
  customerName: string;
  customerPhone: string;
  type: LeadType;
  service?: string | null;
  status: LeadStatus;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['call', 'whatsapp'],
      required: true,
    },
    service: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'completed'],
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ provider: 1, createdAt: -1 });

leadSchema.plugin(toJSON);

export const Lead = model<ILead>('Lead', leadSchema);
