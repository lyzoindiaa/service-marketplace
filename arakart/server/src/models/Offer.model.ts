import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export type OfferScheduleType = 'date_range' | 'single_day_slot';

export interface IOffer extends Document {
  _id: Types.ObjectId;
  provider: Types.ObjectId;
  seller: Types.ObjectId;
  city: string;
  serviceName: string;
  titleEn: string;
  titleHi?: string;
  descriptionEn?: string;
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  scheduleType: OfferScheduleType;
  startDate?: string;
  endDate?: string;
  workHoursStart?: string;
  workHoursEnd?: string;
  singleDate?: string;
  slotStartHour?: string;
  slotEndHour?: string;
  isActive: boolean;
  appliedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      default: 'ara',
      index: true,
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    titleEn: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: 140,
    },
    titleHi: {
      type: String,
      trim: true,
      maxlength: 140,
    },
    descriptionEn: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    offerPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    scheduleType: {
      type: String,
      enum: ['date_range', 'single_day_slot'],
      required: true,
      default: 'date_range',
    },
    startDate: {
      type: String,
      trim: true,
    },
    endDate: {
      type: String,
      trim: true,
    },
    workHoursStart: {
      type: String,
      trim: true,
      default: '09:00',
    },
    workHoursEnd: {
      type: String,
      trim: true,
      default: '18:00',
    },
    singleDate: {
      type: String,
      trim: true,
    },
    slotStartHour: {
      type: String,
      trim: true,
      default: '14:00',
    },
    slotEndHour: {
      type: String,
      trim: true,
      default: '16:00',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    appliedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

offerSchema.pre('save', function (next) {
  if (this.originalPrice > 0 && this.offerPrice >= 0) {
    this.discountPercent = Math.max(
      0,
      Math.round(((this.originalPrice - this.offerPrice) / this.originalPrice) * 100)
    );
  }
  next();
});

offerSchema.plugin(toJSON);

export const Offer = model<IOffer>('Offer', offerSchema);
