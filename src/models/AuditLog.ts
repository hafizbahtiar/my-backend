import mongoose, { Document, Schema } from 'mongoose';

/**
 * Audit Log Entry
 * 
 * Tracks all security events and important user actions
 * for debugging, compliance, and security monitoring
 */

export type AuditActionType = 
  | 'login' 
  | 'logout' 
  | 'register' 
  | 'password_change' 
  | 'password_reset'
  | 'email_change'
  | 'email_verified'
  | 'phone_verified'
  | 'account_deleted'
  | 'account_banned'
  | 'account_unbanned'
  | 'device_trusted'
  | 'google_linked'
  | 'google_unlinked'
  | 'oauth_login'
  | 'session_created'
  | 'session_deleted'
  | 'login_attempt_failed'
  | 'unauthorized_access';

export type AuditStatus = 'success' | 'failure' | 'warning';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: AuditActionType;
  status: AuditStatus;
  ipAddress: string;
  userAgent: string;
  errorMessage?: string;
  metadata?: {
    [key: string]: any;
  };
  timestamp: Date;
  createdAt: Date;
}

// Static methods interface
export interface IAuditLogModel extends mongoose.Model<IAuditLog> {
  findByUserId(userId: mongoose.Types.ObjectId, limit?: number): Promise<IAuditLog[]>;
  findByAction(action: AuditActionType, limit?: number): Promise<IAuditLog[]>;
  findByDateRange(startDate: Date, endDate: Date, limit?: number): Promise<IAuditLog[]>;
  findByIpAddress(ipAddress: string, limit?: number): Promise<IAuditLog[]>;
  findFailedLogins(userId: mongoose.Types.ObjectId, hours: number): Promise<IAuditLog[]>;
  cleanupOldLogs(daysToKeep: number): Promise<number>;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Some events may not have userId (e.g., failed login attempts before auth)
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'login',
        'logout',
        'register',
        'password_change',
        'password_reset',
        'email_change',
        'email_verified',
        'phone_verified',
        'account_deleted',
        'account_banned',
        'account_unbanned',
        'device_trusted',
        'google_linked',
        'google_unlinked',
        'oauth_login',
        'session_created',
        'session_deleted',
        'login_attempt_failed',
        'unauthorized_access',
      ],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['success', 'failure', 'warning'],
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
      trim: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs'
  }
);

// Indexes for common queries
AuditLogSchema.index({ userId: 1, action: 1 });
AuditLogSchema.index({ action: 1, status: 1 });
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 }); // Default sort by most recent
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL: 90 days

// Static Methods
AuditLogSchema.statics.findByUserId = async function (
  userId: mongoose.Types.ObjectId,
  limit: number = 100
): Promise<IAuditLog[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByAction = async function (
  action: AuditActionType,
  limit: number = 100
): Promise<IAuditLog[]> {
  return this.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByDateRange = async function (
  startDate: Date,
  endDate: Date,
  limit: number = 100
): Promise<IAuditLog[]> {
  return this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findByIpAddress = async function (
  ipAddress: string,
  limit: number = 100
): Promise<IAuditLog[]> {
  return this.find({ ipAddress })
    .sort({ timestamp: -1 })
    .limit(limit);
};

AuditLogSchema.statics.findFailedLogins = async function (
  userId: mongoose.Types.ObjectId,
  hours: number = 24
): Promise<IAuditLog[]> {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);

  return this.find({
    userId,
    action: { $in: ['login', 'login_attempt_failed'] },
    status: 'failure',
    timestamp: { $gte: cutoff },
  }).sort({ timestamp: -1 });
};

AuditLogSchema.statics.cleanupOldLogs = async function (
  daysToKeep: number = 90
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoff },
  });

  return result.deletedCount || 0;
};

const AuditLog = mongoose.model<IAuditLog, IAuditLogModel>('AuditLog', AuditLogSchema);

export default AuditLog;

