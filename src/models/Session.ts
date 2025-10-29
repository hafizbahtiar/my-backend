import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  country?: string;
  city?: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: mongoose.Types.ObjectId;
  refreshToken: string; // Hashed (Argon2id/bcrypt)
  isActive: boolean;
  lastLogin: Date;
  ipAddress: string;
  userAgent: string;
  location: ILocation;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isExpired(): boolean;
  updateLastLogin(): Promise<void>;
  deactivate(): Promise<void>;
  extend(days?: number): Promise<void>;
}

// Static methods interface
export interface ISessionModel extends mongoose.Model<ISession> {
  findByRefreshToken(refreshToken: string): Promise<ISession | null>;
  findByDeviceId(deviceId: mongoose.Types.ObjectId): Promise<ISession | null>;
  findActiveSessionsByUserId(userId: mongoose.Types.ObjectId): Promise<ISession[]>;
  cleanupExpiredSessions(): Promise<number>;
  deactivateAllUserSessions(userId: mongoose.Types.ObjectId): Promise<void>;
  deactivateSessionByDeviceId(deviceId: mongoose.Types.ObjectId): Promise<void>;
}

const LocationSchema: Schema = new Schema(
  {
    country: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    coordinates: {
      type: [Number],
      default: null,
    },
  },
  { _id: false }
);

const SessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: [true, 'Device ID is required'],
      unique: true, // One session per device
    },
    refreshToken: {
      type: String,
      required: [true, 'Refresh token is required'],
      unique: true, // Ensure uniqueness of hashed tokens
      minlength: [60, 'Hashed refresh token should be at least 60 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
      trim: true,
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
      trim: true,
    },
    location: {
      type: LocationSchema,
      default: {},
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      default: function () {
        // Default: 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        return expiresAt;
      },
    },
  },
  {
    timestamps: true,
    collection: 'sessions'
  }
);

// Instance Methods
SessionSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

SessionSchema.methods.updateLastLogin = async function (): Promise<void> {
  this.lastLogin = new Date();
  await this.save();
};

SessionSchema.methods.deactivate = async function (): Promise<void> {
  this.isActive = false;
  await this.save();
};

SessionSchema.methods.extend = async function (days: number = 7): Promise<void> {
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + days);
  this.expiresAt = newExpiry;
  await this.save();
};

// Static Methods
SessionSchema.statics.findByRefreshToken = async function (refreshToken: string): Promise<ISession | null> {
  return this.findOne({ refreshToken, isActive: true });
};

SessionSchema.statics.findByDeviceId = async function (deviceId: mongoose.Types.ObjectId): Promise<ISession | null> {
  return this.findOne({ deviceId, isActive: true });
};

SessionSchema.statics.findActiveSessionsByUserId = async function (userId: mongoose.Types.ObjectId): Promise<ISession[]> {
  return this.find({ userId, isActive: true, expiresAt: { $gt: new Date() } });
};

SessionSchema.statics.cleanupExpiredSessions = async function (): Promise<number> {
  const result = await this.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount || 0;
};

SessionSchema.statics.deactivateAllUserSessions = async function (userId: mongoose.Types.ObjectId): Promise<void> {
  await this.updateMany({ userId }, { isActive: false });
};

SessionSchema.statics.deactivateSessionByDeviceId = async function (deviceId: mongoose.Types.ObjectId): Promise<void> {
  await this.updateOne({ deviceId }, { isActive: false });
};

// Create indexes
SessionSchema.index({ userId: 1 });
SessionSchema.index({ deviceId: 1 }, { unique: true });
SessionSchema.index({ refreshToken: 1 }, { unique: true });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - auto-delete expired sessions
SessionSchema.index({ userId: 1, isActive: 1 }); // Compound index

const Session = mongoose.model<ISession, ISessionModel>('Session', SessionSchema);

export default Session;

