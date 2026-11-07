import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export interface IServiceItem {
  _id?: Types.ObjectId;
  nameEn: string;
  nameHi?: string;
  startingPrice: number;
}

export interface IRequestedCategory {
  nameEn: string;
  nameHi?: string;
  description?: string;
  status?: 'pending' | 'approved' | 'remapped' | 'rejected';
}

export type ProviderStatus = 'pending' | 'approved' | 'rejected';

export interface IProvider extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  nameEn: string;
  nameHi?: string;
  categories: string[];
  requestedCategory?: IRequestedCategory;
  area: string;
  areaKey: string;
  areasServed: string[];
  areasServedKeys: string[];
  city: string;
  email?: string;
  phone: string;
  whatsapp?: string;
  bioEn?: string;
  bioHi?: string;
  experience?: number;
  workingHours?: string;
  isAllDay: boolean;
  services: IServiceItem[];
  photos: string[];
  avgRating: number;
  reviewCount: number;
  profileViews: number;
  callClicks: number;
  whatsappClicks: number;
  status: ProviderStatus;
  isLive: boolean;
  verified: boolean;
  fromPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const serviceItemSchema = new Schema<IServiceItem>(
  {
    nameEn: { type: String, required: true, trim: true },
    nameHi: { type: String, trim: true },
    startingPrice: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const providerSchema = new Schema<IProvider>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    nameEn: {
      type: String,
      required: [true, 'Provider business name is required'],
      trim: true,
      maxlength: 120,
    },
    nameHi: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    categories: {
      type: [String],
      required: true,
      index: true,
      default: [],
    },
    requestedCategory: {
      nameEn: { type: String, trim: true },
      nameHi: { type: String, trim: true },
      description: { type: String, trim: true },
      status: {
        type: String,
        enum: ['pending', 'approved', 'remapped', 'rejected'],
        default: 'pending',
      },
    },
    area: {
      type: String,
      required: [true, 'Primary locality is required'],
      trim: true,
    },
    areaKey: {
      type: String,
      index: true,
    },
    areasServed: {
      type: [String],
      default: [],
    },
    areasServedKeys: {
      type: [String],
      default: [],
      index: true,
    },
    city: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    whatsapp: {
      type: String,
      trim: true,
    },
    bioEn: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    bioHi: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    experience: {
      type: Number,
      min: 0,
      default: 0,
    },
    workingHours: {
      type: String,
      default: 'Mon–Sat, 9:00 AM – 7:00 PM',
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    services: {
      type: [serviceItemSchema],
      default: [],
    },
    photos: {
      type: [String],
      default: [],
    },
    avgRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      index: true,
    },
    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    profileViews: {
      type: Number,
      default: 0,
    },
    callClicks: {
      type: Number,
      default: 0,
    },
    whatsappClicks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isLive: {
      type: Boolean,
      default: true,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    fromPrice: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: derive fromPrice and lowercase normalized area keys
providerSchema.pre('save', function (next) {
  if (this.area) {
    this.areaKey = this.area.trim().toLowerCase();
  }
  if (this.areasServed && this.areasServed.length > 0) {
    this.areasServedKeys = this.areasServed.map((a) => a.trim().toLowerCase());
  }

  if (this.services && this.services.length > 0) {
    const prices = this.services.map((s) => s.startingPrice).filter((p) => typeof p === 'number');
    this.fromPrice = prices.length > 0 ? Math.min(...prices) : 0;
  } else {
    this.fromPrice = 0;
  }
  next();
});

// Compound indexes for search optimization
providerSchema.index({ city: 1, status: 1, isLive: 1, categories: 1 });
providerSchema.index({ city: 1, areaKey: 1 });

// Full text search index
providerSchema.index({
  nameEn: 'text',
  nameHi: 'text',
  bioEn: 'text',
  bioHi: 'text',
  'services.nameEn': 'text',
});

providerSchema.plugin(toJSON);

export const Provider = model<IProvider>('Provider', providerSchema);
