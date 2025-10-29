import mongoose, { Document, Schema } from 'mongoose';

export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  label: string; // "Home", "Work", "Shipping Address", etc.
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  coordinates?: ICoordinates;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  setAsDefault(): Promise<void>;
  removeDefault(): Promise<void>;
  getFullAddress(): string;
}

// Static methods interface
export interface IAddressModel extends mongoose.Model<IAddress> {
  findDefaultByUserId(userId: mongoose.Types.ObjectId): Promise<IAddress | null>;
  findByUserId(userId: mongoose.Types.ObjectId): Promise<IAddress[]>;
  findByUserIdAndLabel(userId: mongoose.Types.ObjectId, label: string): Promise<IAddress | null>;
}

const CoordinatesSchema: Schema = new Schema(
  {
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
  },
  { _id: false }
);

const AddressSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    label: {
      type: String,
      required: [true, 'Address label is required'],
      trim: true,
      maxlength: [50, 'Label cannot exceed 50 characters'],
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      required: [true, 'State/Province is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    coordinates: {
      type: CoordinatesSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'addresses'
  }
);

// Instance Methods
AddressSchema.methods.setAsDefault = async function (): Promise<void> {
  // Remove default from other addresses by this user
  const Address = this.constructor as IAddressModel;
  await Address.updateMany(
    { userId: this.userId, _id: { $ne: this._id } },
    { isDefault: false }
  );

  this.isDefault = true;
  await this.save();
};

AddressSchema.methods.removeDefault = async function (): Promise<void> {
  this.isDefault = false;
  await this.save();
};

AddressSchema.methods.getFullAddress = function (): string {
  const parts = [
    this.street,
    this.city,
    this.state,
    this.postalCode,
    this.country
  ].filter(Boolean);

  return parts.join(', ');
};

// Static Methods
AddressSchema.statics.findDefaultByUserId = async function (userId: mongoose.Types.ObjectId): Promise<IAddress | null> {
  return this.findOne({ userId, isDefault: true });
};

AddressSchema.statics.findByUserId = async function (userId: mongoose.Types.ObjectId): Promise<IAddress[]> {
  return this.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

AddressSchema.statics.findByUserIdAndLabel = async function (
  userId: mongoose.Types.ObjectId,
  label: string
): Promise<IAddress | null> {
  return this.findOne({ userId, label });
};

// Create indexes
AddressSchema.index({ userId: 1 });
AddressSchema.index({ isDefault: 1 });
AddressSchema.index({ userId: 1, isDefault: 1 }); // Compound index for finding user's default address

const Address = mongoose.model<IAddress, IAddressModel>('Address', AddressSchema);

export default Address;

