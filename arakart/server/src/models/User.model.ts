import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export type UserRole = 'customer' | 'seller' | 'admin';
export type AuthMethod = 'google' | 'email' | 'phone';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email?: string | null;
  emailVerified: boolean;
  passwordHash?: string | null;
  phone?: string | null;
  phoneVerified: boolean;
  googleId?: string | null;
  avatarUrl?: string | null;
  authMethods: AuthMethod[];
  role: UserRole;
  suspended: boolean;
  sellerId?: Types.ObjectId | null;
  favourites: Types.ObjectId[];
  refreshTokenHash?: string | null;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, 'Invalid email format'],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Invalid 10-digit Indian mobile number'],
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    authMethods: {
      type: [String],
      enum: ['google', 'email', 'phone'],
      default: [],
    },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
      index: true,
    },
    suspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      default: null,
    },
    favourites: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Provider',
      },
    ],
    refreshTokenHash: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure user has at least one authentication credential
userSchema.pre('validate', function (next) {
  if (!this.email && !this.phone && !this.googleId) {
    next(new Error('User must have at least one authentication identifier: email, phone, or googleId'));
  } else {
    next();
  }
});

userSchema.plugin(toJSON);

export const User = model<IUser>('User', userSchema);
