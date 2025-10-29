import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  country?: string;
  city?: string;
  coordinates?: [number, number]; // [longitude, latitude]
}

export interface IDevice extends Document {
  userId: mongoose.Types.ObjectId; // Link to User
  platform: 'ios' | 'android' | 'web' | 'desktop' | 'tablet' | 'other';
  deviceModel: string;
  brand: string;
  manufacturer: string;
  osVersion: string;
  deviceName: string;
  isPhysicalDevice: boolean;
  ramTotalMB?: number;
  ramAvailableMB?: number;
  diskTotalBytes?: number;
  diskFreeBytes?: number;
  identifier: string; // Unique device identifier
  fingerprint: string; // Browser/device fingerprint
  extra: Record<string, any>;
  isTrusted: boolean;
  trustedAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastSeen: Date;

  // Instance methods
  markTrusted(): Promise<void>;
  markUntrusted(): Promise<void>;
  markVerified(): Promise<void>;
  updateLastSeen(): Promise<void>;
  updateStats(stats: { ramAvailableMB?: number; diskFreeBytes?: number }): Promise<void>;
}

// Static methods interface
export interface IDeviceModel extends mongoose.Model<IDevice> {
  findByIdentifier(identifier: string): Promise<IDevice | null>;
  findByFingerprint(fingerprint: string): Promise<IDevice | null>;
  findByUserId(userId: mongoose.Types.ObjectId): Promise<IDevice[]>;
  findTrustedDevices(): Promise<IDevice[]>;
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

const DeviceSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      enum: ['ios', 'android', 'web', 'desktop', 'tablet', 'other'],
    },
    deviceModel: {
      type: String,
      required: [true, 'Device model is required'],
      trim: true,
      maxlength: [100, 'Device model cannot exceed 100 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
      maxlength: [100, 'Manufacturer cannot exceed 100 characters'],
    },
    osVersion: {
      type: String,
      required: [true, 'OS version is required'],
      trim: true,
      maxlength: [50, 'OS version cannot exceed 50 characters'],
    },
    deviceName: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
      maxlength: [100, 'Device name cannot exceed 100 characters'],
    },
    isPhysicalDevice: {
      type: Boolean,
      required: [true, 'Physical device status is required'],
    },
    ramTotalMB: {
      type: Number,
      default: null,
    },
    ramAvailableMB: {
      type: Number,
      default: null,
    },
    diskTotalBytes: {
      type: Number,
      default: null,
    },
    diskFreeBytes: {
      type: Number,
      default: null,
    },
    identifier: {
      type: String,
      required: [true, 'Device identifier is required'],
      unique: true,
      trim: true,
    },
    fingerprint: {
      type: String,
      required: [true, 'Device fingerprint is required'],
      trim: true,
    },
    extra: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isTrusted: {
      type: Boolean,
      default: false,
    },
    trustedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'devices'
  }
);

// Instance Methods
DeviceSchema.methods.markTrusted = async function (): Promise<void> {
  this.isTrusted = true;
  this.trustedAt = new Date();
  await this.save();
};

DeviceSchema.methods.markUntrusted = async function (): Promise<void> {
  this.isTrusted = false;
  this.trustedAt = undefined;
  await this.save();
};

DeviceSchema.methods.markVerified = async function (): Promise<void> {
  this.verifiedAt = new Date();
  await this.save();
};

DeviceSchema.methods.updateLastSeen = async function (): Promise<void> {
  this.lastSeen = new Date();
  await this.save();
};

DeviceSchema.methods.updateStats = async function (stats: { ramAvailableMB?: number; diskFreeBytes?: number }): Promise<void> {
  if (stats.ramAvailableMB !== undefined) {
    this.ramAvailableMB = stats.ramAvailableMB;
  }
  if (stats.diskFreeBytes !== undefined) {
    this.diskFreeBytes = stats.diskFreeBytes;
  }
  await this.save();
};

// Static Methods
DeviceSchema.statics.findByIdentifier = async function (identifier: string): Promise<IDevice | null> {
  return this.findOne({ identifier });
};

DeviceSchema.statics.findByFingerprint = async function (fingerprint: string): Promise<IDevice | null> {
  return this.findOne({ fingerprint });
};

DeviceSchema.statics.findByUserId = async function (userId: mongoose.Types.ObjectId): Promise<IDevice[]> {
  return this.find({ userId }).sort({ lastSeen: -1 });
};

DeviceSchema.statics.findTrustedDevices = async function (): Promise<IDevice[]> {
  return this.find({ isTrusted: true });
};

// Create indexes
DeviceSchema.index({ userId: 1 });
DeviceSchema.index({ identifier: 1 }, { unique: true });
DeviceSchema.index({ fingerprint: 1 });

const Device = mongoose.model<IDevice, IDeviceModel>('Device', DeviceSchema);

export default Device;

