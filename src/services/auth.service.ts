import Account from '../models/Account';
import User from '../models/User';
import Session from '../models/Session';
import Device from '../models/Device';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashTokenForDatabase,
  verifyTokenHash,
} from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  AuthenticationError,
  ValidationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import { sendPasswordResetEmail, sendVerificationEmail, sendNotificationEmail } from './email.service';
import { createAuditLog, getClientIP, getUserAgent } from './audit.service';
import mongoose from 'mongoose';

/**
 * Auth Service
 * 
 * Handles authentication-related operations
 */

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  username: string,
  request?: any
) {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }

  // Validate password strength
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Check if email already exists
  const existingAccount = await Account.findByEmail(email);
  if (existingAccount) {
    throw new ConflictError('Email already registered');
  }

  // Check if username is available
  const usernameAvailable = await User.isUsernameAvailable(username);
  if (!usernameAvailable) {
    throw new ConflictError('Username already taken');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create User
  const user = await User.create({
    firstName,
    lastName,
    username,
  });

  // Create Account
  const account = await Account.create({
    userId: user._id,
    email: email.toLowerCase(),
    password: hashedPassword,
    isActive: true,
    isEmailVerified: false,
    isPhoneVerified: false,
  });

  // Log registration
  await createAuditLog({
    userId: (user._id as any).toString(),
    action: 'register',
    status: 'success',
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    metadata: { email, username },
  });

  return {
    user: {
      id: (user._id as any).toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      fullName: user.fullName,
    },
    account: {
      id: (account._id as any).toString(),
      email: account.email,
      isActive: account.isActive,
      isEmailVerified: account.isEmailVerified,
    },
  };
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
  deviceInfo: any,
  clientIP: string,
  request?: any // For audit logging
) {
  // Find account by email
  const account = await Account.findByEmail(email.toLowerCase());
  if (!account) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is active
  if (!account.isActive) {
    throw new AuthenticationError('Account is inactive');
  }

  // Check if account is banned
  if (account.isBanned()) {
    throw new AuthenticationError('Account is banned');
  }

  // Check if account is locked
  if (account.isLocked()) {
    throw new AuthenticationError('Account is locked due to multiple failed attempts');
  }

  // Check if account has password
  if (!account.password) {
    throw new AuthenticationError('Account has no password. Please use OAuth login.');
  }

  // Verify password
  const isValidPassword = await verifyPassword(account.password, password);
  if (!isValidPassword) {
    // Increment login attempts
    await account.incrementLoginAttempts();
    
    // Log failed login attempt
    await createAuditLog({
      userId: account.userId.toString(),
      action: 'login_attempt_failed',
      status: 'failure',
      ipAddress: clientIP,
      userAgent: getUserAgent(request),
      errorMessage: 'Invalid password',
      metadata: { email },
    });
    
    throw new AuthenticationError('Invalid credentials');
  }

  // Reset login attempts on successful login
  await account.resetLoginAttempts();

  // Find or create device
  const device = await Device.findByIdentifier(deviceInfo.identifier);
  let deviceId;

  if (device) {
    // Update existing device
    device.updateLastSeen();
    deviceId = device._id;
  } else {
    // Create new device
    const newDevice = await Device.create({
      ...deviceInfo,
      userId: account.userId,
    });
    deviceId = newDevice._id;
  }

  // Generate JWT refresh token
  const refreshTokenJWT = signRefreshToken(
    account.userId.toString(),
    '' // Will set sessionId after creating session
  );

  // Hash refresh token for storage
  const hashedRefreshToken = await hashTokenForDatabase(refreshTokenJWT);

  // Create session
  const session = await Session.create({
    userId: account.userId,
    deviceId: deviceId,
    refreshToken: hashedRefreshToken,
    isActive: true,
    lastLogin: new Date(),
    ipAddress: clientIP,
    userAgent: deviceInfo.userAgent || '',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Generate access token with session ID
  const accessToken = signAccessToken(
    account.userId.toString(),
    account.email,
    (session._id as any).toString()
  );

  // Get user info - optimized: run in parallel with audit log creation
  const [user] = await Promise.all([
    User.findById(new mongoose.Types.ObjectId(account.userId)).select('firstName lastName username fullName'),
    // Audit log can be created async (fire and forget for better performance)
    createAuditLog({
      userId: account.userId.toString(),
      action: 'login',
      status: 'success',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      metadata: { email, deviceId: (deviceId as any).toString() },
    }).catch(err => console.error('Failed to create audit log:', err)),
  ]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    accessToken,
    refreshToken: refreshTokenJWT, // Send plain JWT to client
    user: {
      id: (user._id as any).toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      fullName: user.fullName,
      email: account.email,
    },
    session: {
      id: (session._id as any).toString(),
      deviceId: session.deviceId.toString(),
    },
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  // Verify JWT refresh token
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }

  // Find session
  const session = await Session.findById(payload.sessionId);
  if (!session) {
    throw new AuthenticationError('Session not found');
  }

  // Verify session is active
  if (!session.isActive) {
    throw new AuthenticationError('Session is inactive');
  }

  // Verify session not expired
  if (session.isExpired()) {
    throw new AuthenticationError('Session has expired');
  }

  // Verify token hash matches
  const matchesHash = await verifyTokenHash(session.refreshToken, refreshToken);
  if (!matchesHash) {
    throw new AuthenticationError('Token validation failed');
  }

  // Get account
  const account = await Account.findByUserId(session.userId);
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Check account status
  if (!account.isActive || account.isBanned() || account.isLocked()) {
    throw new AuthenticationError('Account is not accessible');
  }

  // OPTIMIZED: Update last login and generate token in parallel
  const accessToken = await Promise.all([
    session.updateLastLogin(),
    Promise.resolve(signAccessToken(
      account.userId.toString(),
      account.email,
      (session._id as any).toString()
    )),
  ]).then(([, token]) => token);

  return {
    accessToken,
  };
}

/**
 * Logout - Deactivate session
 */
export async function logout(sessionId: string, request?: any) {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await session.deactivate();

  // Log logout (async - fire and forget for better performance)
  createAuditLog({
    userId: session.userId.toString(),
    action: 'logout',
    status: 'success',
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
    metadata: { sessionId, deviceId: session.deviceId.toString() },
  }).catch(err => console.error('Failed to create audit log:', err));

  return {
    success: true,
    message: 'Logged out successfully',
  };
}

/**
 * Verify email
 */
export async function verifyEmail(accountId: string) {
  const account = await Account.findById(accountId);
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  await account.verifyEmail();

  return {
    success: true,
    message: 'Email verified successfully',
  };
}

/**
 * Request password reset (generates reset token and sends email)
 */
export async function requestPasswordReset(email: string) {
  const account = await Account.findByEmail(email.toLowerCase());
  if (!account) {
    // Don't reveal if account exists (security best practice)
    return {
      success: true,
      message: 'If account exists, password reset email has been sent',
    };
  }

  // Check if account has password
  if (!account.hasPassword()) {
    return {
      success: true,
      message: 'If account exists, password reset email has been sent',
    };
  }

  // Generate reset token
  const resetToken = await generateSecureToken(32);
  
  // Store reset token with expiration (1 hour)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);
  
  account.resetToken = resetToken;
  account.resetTokenExpiresAt = expiresAt;
  await account.save();

  // Send email
  try {
    await sendPasswordResetEmail(account.email, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't fail the request, just log the error
  }
  
  return {
    success: true,
    message: 'If account exists, password reset email has been sent',
  };
}

/**
 * Confirm password reset using reset token
 */
export async function confirmPasswordReset(resetToken: string, newPassword: string) {
  // Find account with matching reset token
  const account = await Account.findOne({
    resetToken,
    resetTokenExpiresAt: { $gt: new Date() }, // Token not expired
  });

  if (!account) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  // Validate password
  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  account.password = hashedPassword;
  account.resetToken = undefined;
  account.resetTokenExpiresAt = undefined;
  account.lastPasswordChange = new Date();
  account.loginAttempts = 0; // Reset login attempts
  account.lockUntil = undefined; // Unlock if locked
  await account.save();

  // Send notification email
  try {
    await sendNotificationEmail(
      account.email,
      'Password Reset Successful',
      'Your password has been successfully reset. If you did not perform this action, please contact support immediately.'
    );
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }

  return {
    success: true,
    message: 'Password has been reset successfully',
  };
}

/**
 * Change password (for logged-in users)
 */
export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  // Find account
  const account = await Account.findByUserId(new mongoose.Types.ObjectId(userId));
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Check if account has password
  if (!account.password) {
    throw new AuthenticationError('Account has no password set. Please use password reset instead.');
  }

  // Verify old password
  const isValid = await verifyPassword(account.password, oldPassword);
  if (!isValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password
  await account.updatePassword(hashedPassword);

  // Send notification email
  try {
    await sendNotificationEmail(
      account.email,
      'Password Changed',
      'Your password has been changed successfully. If you did not perform this action, please contact support immediately.'
    );
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }

  return {
    success: true,
    message: 'Password changed successfully',
  };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string) {
  const account = await Account.findByEmail(email.toLowerCase());
  if (!account) {
    // Don't reveal if account exists
    return {
      success: true,
      message: 'If account exists, verification email has been sent',
    };
  }

  // Check if already verified
  if (account.isEmailVerified) {
    return {
      success: true,
      message: 'Email is already verified',
    };
  }

  // Generate verification token
  const verificationToken = await generateSecureToken(32);
  
  // Store token with expiration (24 hours)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  account.emailVerificationToken = verificationToken;
  account.emailVerificationTokenExpiresAt = expiresAt;
  await account.save();

  // Send email
  try {
    await sendVerificationEmail(account.email, verificationToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
  
  return {
    success: true,
    message: 'If account exists, verification email has been sent',
  };
}

/**
 * Verify email using verification token
 */
/**
 * Delete user account (soft delete)
 * Requires password verification for security
 */
export async function deleteAccount(userId: string, password: string, request?: any) {
  // Find account
  const account = await Account.findByUserId(new mongoose.Types.ObjectId(userId));
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Verify password
  if (!account.password) {
    throw new AuthenticationError('Account has no password. Cannot verify deletion.');
  }

  const isValidPassword = await verifyPassword(account.password, password);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid password');
  }

  // Get client IP and user agent for audit logging
  const clientIP = getClientIP(request);
  const userAgent = getUserAgent(request);

  // Deactivate account (soft delete)
  account.isActive = false;
  await account.save();

  // Deactivate all sessions
  await Session.deactivateAllUserSessions(account.userId);

  // Log account deletion
  await createAuditLog({
    userId: account.userId.toString(),
    action: 'account_deleted',
    status: 'success',
    ipAddress: clientIP,
    userAgent,
    metadata: { email: account.email },
  });

  // Optionally: Send notification email
  try {
    await sendNotificationEmail(
      account.email,
      'Account Deleted',
      'Your account has been successfully deleted. If this was not you, please contact support immediately.'
    );
  } catch (error) {
    // Don't fail the deletion if email fails
    console.error('Failed to send deletion notification email:', error);
  }

  return {
    success: true,
    message: 'Account deleted successfully',
  };
}

export async function verifyEmailWithToken(verificationToken: string) {
  // Find account with matching token
  const account = await Account.findOne({
    emailVerificationToken: verificationToken,
    emailVerificationTokenExpiresAt: { $gt: new Date() }, // Token not expired
  });

  if (!account) {
    throw new AuthenticationError('Invalid or expired verification token');
  }

  // Check if already verified
  if (account.isEmailVerified) {
    return {
      success: true,
      message: 'Email is already verified',
    };
  }

  // Verify email
  account.isEmailVerified = true;
  account.emailVerificationToken = undefined;
  account.emailVerificationTokenExpiresAt = undefined;
  await account.save();

  return {
    success: true,
    message: 'Email verified successfully',
  };
}

