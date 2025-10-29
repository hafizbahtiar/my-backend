import mongoose, { Document, Schema } from 'mongoose';

export interface IBan {
  type: 'temporary' | 'permanent' | null;
  startAt?: Date;
  endAt?: Date;
  reason?: string;
}

export interface IOAuthProvider {
  provider: 'google' | 'github' | 'apple'; // Add more providers as needed
  providerId: string; // User ID from OAuth provider
  providerEmail: string; // Email from OAuth provider
  accessToken?: string; // Encrypted, optional
  refreshToken?: string; // Encrypted, optional
  expiresAt?: Date;
  linkedAt: Date;
  lastLogin?: Date;
}

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  password?: string; // Argon2id hash (optional for OAuth-only users)
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  ban: IBan;
  loginAttempts: number;
  lastAttemptAt?: Date;
  lockUntil?: Date;
  providers: IOAuthProvider[]; // OAuth provider accounts
  // Email verification
  emailVerificationToken?: string;
  emailVerificationTokenExpiresAt?: Date;
  // Password reset
  resetToken?: string;
  resetTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastPasswordChange?: Date;

  // Instance methods
  isBanned(): boolean;
  isLocked(): boolean;
  incrementLoginAttempts(maxAttempts?: number, lockDuration?: number): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  lockAccount(durationMinutes: number): Promise<void>;
  unlockAccount(): Promise<void>;
  banAccount(type: 'temporary' | 'permanent', reason?: string, endAt?: Date): Promise<void>;
  unban(): Promise<void>;
  verifyEmail(): Promise<void>;
  verifyPhone(): Promise<void>;
  updatePassword(passwordHash: string): Promise<void>;
  
  // OAuth methods
  addProvider(provider: IOAuthProvider): Promise<void>;
  removeProvider(provider: 'google' | 'github' | 'apple'): Promise<void>;
  hasProvider(provider: 'google' | 'github' | 'apple'): boolean;
  hasPassword(): boolean;
}

// Static methods interface
export interface IAccountModel extends mongoose.Model<IAccount> {
  findByEmail(email: string): Promise<IAccount | null>;
  findByUserId(userId: mongoose.Types.ObjectId): Promise<IAccount | null>;
  isEmailAvailable(email: string): Promise<boolean>;
}

const BanSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['temporary', 'permanent', null],
      default: null,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      default: null,
      maxlength: [500, 'Ban reason cannot exceed 500 characters'],
    },
  },
  { _id: false }
);

const AccountSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: false, // Optional for OAuth-only users
      minlength: [60, 'Hashed password should be at least 60 characters'], // Argon2id hashes are long
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    ban: {
      type: BanSchema,
      default: () => ({ type: null }),
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    providers: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    // Email verification tokens
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationTokenExpiresAt: {
      type: Date,
      default: null,
    },
    // Password reset tokens
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'accounts'
  }
);

// Instance Methods
AccountSchema.methods.isBanned = function (): boolean {
  if (!this.ban.type) return false;

  if (this.ban.type === 'permanent') return true;

  // Check if temporary ban is still active
  if (this.ban.type === 'temporary' && this.ban.endAt) {
    return new Date() < this.ban.endAt;
  }

  return false;
};

AccountSchema.methods.isLocked = function (): boolean {
  if (!this.lockUntil) return false;
  return new Date() < this.lockUntil;
};

AccountSchema.methods.incrementLoginAttempts = async function (
  maxAttempts: number = 5,
  lockDuration: number = 30
): Promise<void> {
  this.loginAttempts += 1;
  this.lastAttemptAt = new Date();

  // Lock account if max attempts reached
  if (this.loginAttempts >= maxAttempts) {
    await this.lockAccount(lockDuration);
  }

  await this.save();
};

AccountSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lastAttemptAt = undefined;
  this.lockUntil = undefined;
  await this.save();
};

AccountSchema.methods.lockAccount = async function (durationMinutes: number): Promise<void> {
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);
  this.lockUntil = lockUntil;
  await this.save();
};

AccountSchema.methods.unlockAccount = async function (): Promise<void> {
  this.lockUntil = undefined;
  await this.save();
};

AccountSchema.methods.banAccount = async function (
  type: 'temporary' | 'permanent',
  reason?: string,
  endAt?: Date
): Promise<void> {
  this.ban = {
    type,
    startAt: new Date(),
    endAt: type === 'temporary' ? endAt : undefined,
    reason,
  };
  await this.save();
};

AccountSchema.methods.unban = async function (): Promise<void> {
  this.ban = {
    type: null,
    startAt: undefined,
    endAt: undefined,
    reason: undefined,
  };
  await this.save();
};

AccountSchema.methods.verifyEmail = async function (): Promise<void> {
  this.isEmailVerified = true;
  await this.save();
};

AccountSchema.methods.verifyPhone = async function (): Promise<void> {
  this.isPhoneVerified = true;
  await this.save();
};

AccountSchema.methods.updatePassword = async function (passwordHash: string): Promise<void> {
  this.password = passwordHash;
  this.lastPasswordChange = new Date();
  // Reset login attempts when password is changed
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// OAuth methods
AccountSchema.methods.addProvider = async function (provider: IOAuthProvider): Promise<void> {
  if (!this.providers) {
    this.providers = [];
  }
  
  // Check if provider already exists
  const existingIndex = this.providers.findIndex((p: any) => p.provider === provider.provider);
  if (existingIndex >= 0) {
    // Update existing provider
    this.providers[existingIndex] = provider;
  } else {
    // Add new provider
    this.providers.push(provider);
  }
  
  await this.save();
};

AccountSchema.methods.removeProvider = async function (provider: 'google' | 'github' | 'apple'): Promise<void> {
  if (!this.providers) return;
  
  this.providers = this.providers.filter((p: any) => p.provider !== provider);
  await this.save();
};

AccountSchema.methods.hasProvider = function (provider: 'google' | 'github' | 'apple'): boolean {
  if (!this.providers) return false;
  return this.providers.some((p: any) => p.provider === provider);
};

AccountSchema.methods.hasPassword = function (): boolean {
  return !!this.password;
};

// Static Methods
AccountSchema.statics.findByEmail = async function (email: string): Promise<IAccount | null> {
  return this.findOne({ email: email.toLowerCase() });
};

AccountSchema.statics.findByUserId = async function (userId: mongoose.Types.ObjectId): Promise<IAccount | null> {
  return this.findOne({ userId });
};

AccountSchema.statics.isEmailAvailable = async function (email: string): Promise<boolean> {
  const account = await this.findOne({ email: email.toLowerCase() });
  return !account;
};

// Create indexes
AccountSchema.index({ userId: 1 }, { unique: true });
AccountSchema.index({ email: 1 }, { unique: true });
AccountSchema.index({ isActive: 1 });

const Account = mongoose.model<IAccount, IAccountModel>('Account', AccountSchema);

export default Account;

