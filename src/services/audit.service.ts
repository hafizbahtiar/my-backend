import AuditLog, { AuditActionType, AuditStatus } from '../models/AuditLog';
import mongoose from 'mongoose';

/**
 * Audit Service
 * 
 * Handles audit logging for security events and user actions
 */

export interface AuditLogData {
  userId?: string;
  action: AuditActionType;
  status: AuditStatus;
  ipAddress: string;
  userAgent: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Create audit log entry
 * 
 * This is the main function for logging all security events.
 * It should be called after every important action.
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await AuditLog.create({
      userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : undefined,
      action: data.action,
      status: data.status,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      errorMessage: data.errorMessage,
      metadata: data.metadata || {},
      timestamp: new Date(),
    });

    // Optionally log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📝 Audit: ${data.action} - ${data.status} for user ${data.userId || 'anonymous'}`);
    }
  } catch (error) {
    // Don't throw error if audit logging fails - just log it
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get user audit logs
 */
export async function getUserAuditLogs(userId: string, limit: number = 100) {
  const logs = await AuditLog.findByUserId(
    new mongoose.Types.ObjectId(userId),
    limit
  );

  return logs.map((log) => ({
    id: (log._id as any).toString(),
    action: log.action,
    status: log.status,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    errorMessage: log.errorMessage,
    metadata: log.metadata,
    timestamp: log.timestamp,
    createdAt: log.createdAt,
  }));
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(action: AuditActionType, limit: number = 100) {
  const logs = await AuditLog.findByAction(action, limit);

  return logs.map((log) => ({
    id: (log._id as any).toString(),
    userId: log.userId ? log.userId.toString() : null,
    action: log.action,
    status: log.status,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    errorMessage: log.errorMessage,
    metadata: log.metadata,
    timestamp: log.timestamp,
    createdAt: log.createdAt,
  }));
}

/**
 * Get audit logs by IP address
 */
export async function getAuditLogsByIp(ipAddress: string, limit: number = 100) {
  const logs = await AuditLog.findByIpAddress(ipAddress, limit);

  return logs.map((log) => ({
    id: (log._id as any).toString(),
    userId: log.userId ? log.userId.toString() : null,
    action: log.action,
    status: log.status,
    userAgent: log.userAgent,
    errorMessage: log.errorMessage,
    metadata: log.metadata,
    timestamp: log.timestamp,
    createdAt: log.createdAt,
  }));
}

/**
 * Get audit logs by date range
 */
export async function getAuditLogsByDateRange(
  startDate: Date,
  endDate: Date,
  limit: number = 100
) {
  const logs = await AuditLog.findByDateRange(startDate, endDate, limit);

  return logs.map((log) => ({
    id: (log._id as any).toString(),
    userId: log.userId ? log.userId.toString() : null,
    action: log.action,
    status: log.status,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    errorMessage: log.errorMessage,
    metadata: log.metadata,
    timestamp: log.timestamp,
    createdAt: log.createdAt,
  }));
}

/**
 * Get failed login attempts for a user
 * Useful for detecting brute force attacks
 */
export async function getFailedLoginAttempts(userId: string, hours: number = 24) {
  const logs = await AuditLog.findFailedLogins(new mongoose.Types.ObjectId(userId), hours);

  return logs.map((log) => ({
    id: (log._id as any).toString(),
    action: log.action,
    status: log.status,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    errorMessage: log.errorMessage,
    metadata: log.metadata,
    timestamp: log.timestamp,
  }));
}

/**
 * Cleanup old audit logs
 * This is typically run as a scheduled job
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const deletedCount = await AuditLog.cleanupOldLogs(daysToKeep);
  
  console.log(`🧹 Cleaned up ${deletedCount} old audit logs (kept ${daysToKeep} days)`);
  
  return deletedCount;
}

/**
 * Helper: Get client IP from request
 */
export function getClientIP(request: any): string {
  return request.header('x-forwarded-for')?.split(',')[0].trim() ||
         request.header('x-real-ip') ||
         request.header('cf-connecting-ip') ||
         'unknown';
}

/**
 * Helper: Get user agent from request
 */
export function getUserAgent(request: any): string {
  return request.header('user-agent') || 'unknown';
}

