import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  keyId: string; // public identifier (part of the API key)
  keyHash: string; // hash of the secret part; never store plaintext
  scopes: string[];
  ipAllowlist?: string[];
  enabled: boolean;
  expiresAt?: Date | null;
  lastUsedAt?: Date | null;
  lastUsedIp?: string | null;
  usageCount: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiKeyModel extends mongoose.Model<IApiKey> {
  findByKeyId(keyId: string): Promise<IApiKey | null>;
}

const ApiKeySchema: Schema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    keyId: { type: String, required: true, unique: true, index: true },
    keyHash: { type: String, required: true, unique: true, minlength: 60 },
    scopes: { type: [String], default: [] },
    ipAllowlist: { type: [String], default: [] },
    enabled: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: null },
    lastUsedIp: { type: String, default: null },
    usageCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    collection: 'api_keys',
  }
);

ApiKeySchema.statics.findByKeyId = async function (keyId: string): Promise<IApiKey | null> {
  return this.findOne({ keyId, enabled: true });
};

ApiKeySchema.index({ ownerId: 1, enabled: 1 });
ApiKeySchema.index({ expiresAt: 1 });

const ApiKey = mongoose.model<IApiKey, IApiKeyModel>('ApiKey', ApiKeySchema);

export default ApiKey;


