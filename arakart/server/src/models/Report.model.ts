import { Schema, model, Document, Types } from 'mongoose';
import { toJSON } from './plugins/toJSON.plugin';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface IReport extends Document {
  _id: Types.ObjectId;
  provider: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason: string;
  status: ReportStatus;
  adminNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    adminNote: {
      type: String,
      default: null,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.plugin(toJSON);

export const Report = model<IReport>('Report', reportSchema);
