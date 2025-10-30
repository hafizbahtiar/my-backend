import mongoose, { Document, Schema } from 'mongoose';

export type CronJobStatus = 'idle' | 'running' | 'failed' | 'paused';

export interface ICronJob extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: string;
  cron: string;
  timezone: string;
  payload?: Record<string, unknown> | null;
  enabled: boolean;
  ownerId: string;
  lastRunAt?: Date | null;
  nextRunAt?: Date | null;
  status: CronJobStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICronJobModel extends mongoose.Model<ICronJob> {
  findEnabledByOwner(ownerId: string): Promise<ICronJob[]>;
}

const CronJobSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Job name is required'],
      trim: true,
      maxlength: [120, 'Job name cannot exceed 120 characters'],
    },
    type: {
      type: String,
      required: [true, 'Job type is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    cron: {
      type: String,
      required: [true, 'Cron expression is required'],
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      default: 'UTC',
      trim: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: null,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['idle', 'running', 'failed', 'paused'],
      default: 'idle',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'cron_jobs',
  }
);

// Compound unique per owner for name
CronJobSchema.index({ ownerId: 1, name: 1 }, { unique: true });

// Static Methods
CronJobSchema.statics.findEnabledByOwner = async function (
  ownerId: string
): Promise<ICronJob[]> {
  return this.find({ ownerId, enabled: true });
};

const CronJob = mongoose.model<ICronJob, ICronJobModel>('CronJob', CronJobSchema);

export default CronJob;


