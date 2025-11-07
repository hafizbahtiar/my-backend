import mongoose, { Document, Schema } from 'mongoose';

export interface IStripeCustomer extends Document {
  userId: mongoose.Types.ObjectId;
  stripeCustomerId: string; // Stripe customer ID (cus_xxx)
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  updateFromStripe(stripeCustomer: any): Promise<void>;
}

// Static methods interface
export interface IStripeCustomerModel extends mongoose.Model<IStripeCustomer> {
  findByUserId(userId: mongoose.Types.ObjectId): Promise<IStripeCustomer | null>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<IStripeCustomer | null>;
  findByEmail(email: string): Promise<IStripeCustomer | null>;
}

const StripeCustomerSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      required: [true, 'Stripe customer ID is required'],
      unique: true,
      index: true,
      match: [/^cus_/, 'Stripe customer ID must start with cus_'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'stripe_customers',
  }
);

// Instance Methods
StripeCustomerSchema.methods.updateFromStripe = async function (stripeCustomer: any): Promise<void> {
  this.email = stripeCustomer.email || this.email;
  this.name = stripeCustomer.name || this.name;
  if (stripeCustomer.metadata) {
    this.metadata = new Map(Object.entries(stripeCustomer.metadata));
  }
  await this.save();
};

// Static Methods
StripeCustomerSchema.statics.findByUserId = async function (
  userId: mongoose.Types.ObjectId
): Promise<IStripeCustomer | null> {
  return this.findOne({ userId });
};

StripeCustomerSchema.statics.findByStripeCustomerId = async function (
  stripeCustomerId: string
): Promise<IStripeCustomer | null> {
  return this.findOne({ stripeCustomerId });
};

StripeCustomerSchema.statics.findByEmail = async function (
  email: string
): Promise<IStripeCustomer | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Create indexes
StripeCustomerSchema.index({ userId: 1 }, { unique: true });
StripeCustomerSchema.index({ stripeCustomerId: 1 }, { unique: true });
StripeCustomerSchema.index({ email: 1 });

const StripeCustomer = mongoose.model<IStripeCustomer, IStripeCustomerModel>(
  'StripeCustomer',
  StripeCustomerSchema
);

export default StripeCustomer;

