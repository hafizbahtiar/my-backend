import Session from '../models/Session';
import { NotFoundError } from '../utils/errors';
import mongoose from 'mongoose';

/**
 * Session Service
 * 
 * Handles session management operations
 */

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string) {
  const sessions = await Session.findActiveSessionsByUserId(new mongoose.Types.ObjectId(userId));

  return sessions.map((session: any) => ({
    id: (session._id as any).toString(),
    deviceId: session.deviceId.toString(),
    isActive: session.isActive,
    lastLogin: session.lastLogin,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }));
}

/**
 * Deactivate a session
 */
export async function deactivateSession(sessionId: string) {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await session.deactivate();

  return {
    success: true,
    message: 'Session deactivated',
  };
}

/**
 * Deactivate all user sessions
 */
export async function deactivateAllUserSessions(userId: string) {
  await Session.deactivateAllUserSessions(new mongoose.Types.ObjectId(userId));

  return {
    success: true,
    message: 'All sessions deactivated',
  };
}

/**
 * Deactivate session by device ID
 */
export async function deactivateSessionByDevice(deviceId: string) {
  await Session.deactivateSessionByDeviceId(new mongoose.Types.ObjectId(deviceId));

  return {
    success: true,
    message: 'Session deactivated',
  };
}

/**
 * Get session details
 */
export async function getSessionDetails(sessionId: string) {
  const session = await Session.findById(new mongoose.Types.ObjectId(sessionId));
  if (!session) {
    throw new NotFoundError('Session not found');
  }

  return {
    id: (session._id as any).toString(),
    userId: session.userId.toString(),
    deviceId: session.deviceId.toString(),
    isActive: session.isActive,
    lastLogin: session.lastLogin,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    location: session.location,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

/**
 * Extend session expiration
 */
export async function extendSession(sessionId: string, additionalDays: number = 7) {
  const session = await Session.findById(new mongoose.Types.ObjectId(sessionId));
  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await session.extend(additionalDays);

  return {
    success: true,
    message: 'Session extended',
    newExpiresAt: session.expiresAt,
  };
}

