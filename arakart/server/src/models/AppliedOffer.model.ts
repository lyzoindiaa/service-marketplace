import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface IAppliedOffer extends Document {
  _id: Types.ObjectId;
  offer: Types.ObjectId;
  provider: Types.ObjectId;
  customer: Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  offerTitle: string;
  originalPrice: number;
  offerPrice: number;
  claimCode: string;
  status: 'applied' | 'redeemed' | 'expired';
  createdAt: Date;
}

const appliedOfferSchema = new Schema<IAppliedOffer>(
  {
    offer: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
      index: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      index: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    offerTitle: {
      type: String,
      required: true,
      trim: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    offerPrice: {
      type: Number,
      required: true,
    },
    claimCode: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['applied', 'redeemed', 'expired'],
      default: 'applied',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

appliedOfferSchema.index({ offer: 1, customer: 1 }, { unique: true });
appliedOfferSchema.plugin(toJSON);

export const AppliedOffer = model<IAppliedOffer>('AppliedOffer', appliedOfferSchema);
