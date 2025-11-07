import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  stripePaymentIntentId: string; // Stripe payment intent ID (pi_xxx)
  stripeCustomerId?: string; // Optional: linked customer
  amount: number; // Amount in cents
  currency: string; // ISO currency code (e.g., 'usd')
  status: PaymentStatus;
  metadata?: Record<string, string>;
  description?: string;
  // Payment method info (snapshot at time of payment)
  paymentMethodType?: string; // e.g., 'card'
  paymentMethodLast4?: string; // Last 4 digits of card
  // Timestamps
  paidAt?: Date; // When payment succeeded
  canceledAt?: Date; // When payment was canceled
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markAsSucceeded(): Promise<void>;
  markAsCanceled(): Promise<void>;
  updateStatus(status: PaymentStatus): Promise<void>;
}

// Static methods interface
export interface IPaymentModel extends mongoose.Model<IPayment> {
  findByUserId(userId: mongoose.Types.ObjectId, limit?: number): Promise<IPayment[]>;
  findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<IPayment | null>;
  findByStatus(status: PaymentStatus, limit?: number): Promise<IPayment[]>;
  getTotalAmountByUserId(userId: mongoose.Types.ObjectId): Promise<number>;
}

const PaymentSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, 'Stripe payment intent ID is required'],
      unique: true,
      index: true,
      match: [/^pi_/, 'Stripe payment intent ID must start with pi_'],
    },
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
      match: [/^cus_/, 'Stripe customer ID must start with cus_'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      length: [3, 'Currency must be a 3-letter ISO code'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'requires_capture',
        'canceled',
        'succeeded',
      ],
      default: 'requires_payment_method',
      index: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    description: {
      type: String,
      default: null,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    paymentMethodType: {
      type: String,
      default: null,
    },
    paymentMethodLast4: {
      type: String,
      default: null,
      maxlength: [4, 'Last 4 digits cannot exceed 4 characters'],
    },
    paidAt: {
      type: Date,
      default: null,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

// Instance Methods
PaymentSchema.methods.markAsSucceeded = async function (): Promise<void> {
  this.status = 'succeeded';
  this.paidAt = new Date();
  await this.save();
};

PaymentSchema.methods.markAsCanceled = async function (): Promise<void> {
  this.status = 'canceled';
  this.canceledAt = new Date();
  await this.save();
};

PaymentSchema.methods.updateStatus = async function (status: PaymentStatus): Promise<void> {
  this.status = status;
  if (status === 'succeeded' && !this.paidAt) {
    this.paidAt = new Date();
  }
  if (status === 'canceled' && !this.canceledAt) {
    this.canceledAt = new Date();
  }
  await this.save();
};

// Static Methods
PaymentSchema.statics.findByUserId = async function (
  userId: mongoose.Types.ObjectId,
  limit: number = 50
): Promise<IPayment[]> {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

PaymentSchema.statics.findByStripePaymentIntentId = async function (
  stripePaymentIntentId: string
): Promise<IPayment | null> {
  return this.findOne({ stripePaymentIntentId });
};

PaymentSchema.statics.findByStatus = async function (
  status: PaymentStatus,
  limit: number = 50
): Promise<IPayment[]> {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

PaymentSchema.statics.getTotalAmountByUserId = async function (
  userId: mongoose.Types.ObjectId
): Promise<number> {
  const result = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Create indexes
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ stripePaymentIntentId: 1 }, { unique: true });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ stripeCustomerId: 1 });
PaymentSchema.index({ createdAt: -1 }); // For cleanup queries

const Payment = mongoose.model<IPayment, IPaymentModel>('Payment', PaymentSchema);

export default Payment;

