import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  fullName: string;
  username: string; // @username format
  avatar?: string;
  phoneNumber?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  generateFullName(): void;
  updateFullName(): void;
}

// Static methods interface
export interface IUserModel extends mongoose.Model<IUser> {
  findByUsername(username: string): Promise<IUser | null>;
  isUsernameAvailable(username: string): Promise<boolean>;
  searchByFullName(query: string): Promise<IUser[]>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^@[a-z0-9_.-]{3,}$/, 'Username must start with @ and contain only lowercase letters, numbers, dots, underscores, or hyphens'],
      minlength: [4, 'Username must be at least 3 characters (plus @)'],
    },
    avatar: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'users'
  }
);

// Instance Methods
UserSchema.methods.generateFullName = function (): void {
  this.fullName = `${this.firstName} ${this.lastName}`.trim();
};

UserSchema.methods.updateFullName = function (): void {
  this.generateFullName();
};

// Hook to auto-generate fullName before saving
UserSchema.pre('save', function (next) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = this as any;
  if (doc.isModified('firstName') || doc.isModified('lastName')) {
    doc.generateFullName();
  }
  next();
});

// Static Methods
UserSchema.statics.findByUsername = async function (username: string): Promise<IUser | null> {
  return this.findOne({ username: username.toLowerCase() });
};

UserSchema.statics.isUsernameAvailable = async function (username: string): Promise<boolean> {
  const user = await this.findOne({ username: username.toLowerCase() });
  return !user;
};

UserSchema.statics.searchByFullName = async function (query: string): Promise<IUser[]> {
  return this.find({ $text: { $search: query } }).limit(10);
};

// Create indexes
UserSchema.index({ fullName: 'text' }); // Full-text search index

const User = mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;

