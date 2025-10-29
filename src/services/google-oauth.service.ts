import Account from '../models/Account';
import User from '../models/User';
import Session from '../models/Session';
import Device from '../models/Device';
import { verifyGoogleToken, type GoogleUserInfo } from '../utils/google-oauth';
import { verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { hashTokenForDatabase } from '../utils/password';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors';
import mongoose from 'mongoose';
import type { IOAuthProvider } from '../models/Account';

/**
 * Google OAuth Service
 * 
 * Handles Google OAuth authentication and account linking
 */

/**
 * Login or register with Google OAuth
 * 
 * Flutter sends Google ID token, backend verifies and returns our tokens
 */
export async function loginWithGoogle(
  idToken: string,
  deviceInfo: any,
  clientIP: string
) {
  // Verify Google token
  const googleUser = await verifyGoogleToken(idToken);

  // Check if Google account already linked to an account
  const existingAccount = await Account.findOne({
    'providers.provider': 'google',
    'providers.providerId': googleUser.sub,
  });

  if (existingAccount) {
    // Google account already linked, normal login
    return await performGoogleLogin(existingAccount, googleUser, deviceInfo, clientIP);
  }

  // Check if email exists in any account
  const accountByEmail = await Account.findByEmail(googleUser.email);

  if (!accountByEmail) {
    // New user, create account
    return await createAccountFromGoogle(googleUser, deviceInfo, clientIP);
  }

  // Email exists but not linked to Google
  // Check if account has password
  if (accountByEmail.hasPassword()) {
    // Has password - need explicit linking
    throw new AuthenticationError('EMAIL_EXISTS_PASSWORD');
  }

  // OAuth-only account, auto-link Google
  await accountByEmail.addProvider(createProviderObject(googleUser));
  
  return await performGoogleLogin(accountByEmail, googleUser, deviceInfo, clientIP);
}

/**
 * Link Google account to existing account (with password verification)
 */
export async function linkGoogleAccount(
  userId: string,
  idToken: string,
  password: string
) {
  // Verify Google token
  const googleUser = await verifyGoogleToken(idToken);

  // Get account
  const account = await Account.findByUserId(new mongoose.Types.ObjectId(userId));
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Verify password
  if (!account.password) {
    throw new AuthenticationError('Account has no password set');
  }

  const isValid = await verifyPassword(account.password, password);
  if (!isValid) {
    throw new AuthenticationError('Invalid password');
  }

  // Check if Google already linked
  if (account.hasProvider('google')) {
    throw new ConflictError('Google account already linked');
  }

  // Link Google account
  await account.addProvider(createProviderObject(googleUser));

  return {
    success: true,
    message: 'Google account linked successfully',
  };
}

/**
 * Unlink Google account
 */
export async function unlinkGoogleAccount(userId: string) {
  const account = await Account.findByUserId(new mongoose.Types.ObjectId(userId));
  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Must have password or another OAuth provider
  if (!account.hasPassword() && account.providers.length <= 1) {
    throw new AuthenticationError('Cannot unlink last authentication method');
  }

  await account.removeProvider('google');

  return {
    success: true,
    message: 'Google account unlinked successfully',
  };
}

/**
 * Helper: Create provider object from Google user info
 */
function createProviderObject(googleUser: GoogleUserInfo): IOAuthProvider {
  return {
    provider: 'google',
    providerId: googleUser.sub,
    providerEmail: googleUser.email,
    linkedAt: new Date(),
    lastLogin: new Date(),
  };
}

/**
 * Helper: Create account from Google OAuth
 */
async function createAccountFromGoogle(
  googleUser: GoogleUserInfo,
  deviceInfo: any,
  clientIP: string
) {
  // Generate default username from email
  const defaultUsername = `@user_${Math.random().toString(36).substr(2, 9)}`;

  // Create User
  const user = await User.create({
    firstName: googleUser.givenName || '',
    lastName: googleUser.familyName || '',
    username: defaultUsername,
    avatar: googleUser.picture,
  });

  // Create Account
  const account = await Account.create({
    userId: user._id,
    email: googleUser.email,
    isActive: true,
    isEmailVerified: googleUser.emailVerified,
    isPhoneVerified: false,
    providers: [createProviderObject(googleUser)],
  });

  // Create Device
  const device = await Device.create({
    ...deviceInfo,
    userId: user._id,
  });

  // Create Session (will generate token after)
  const session = await Session.create({
    userId: user._id,
    deviceId: device._id,
    refreshToken: 'temp', // Placeholder
    isActive: true,
    lastLogin: new Date(),
    ipAddress: clientIP,
    userAgent: deviceInfo.userAgent || '',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // Generate tokens with session ID
  const refreshTokenJWT = signRefreshToken((user._id as any).toString(), (session._id as any).toString());
  const hashedRefreshToken = await hashTokenForDatabase(refreshTokenJWT);

  // Update session with hashed token
  session.refreshToken = hashedRefreshToken;
  await session.save();

  // Generate access token
  const accessToken = signAccessToken(
    (user._id as any).toString(),
    account.email,
    (session._id as any).toString()
  );

  return {
    accessToken,
    refreshToken: refreshTokenJWT,
    user: {
      id: (user._id as any).toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      fullName: user.fullName,
      email: account.email,
      avatar: googleUser.picture,
    },
    session: {
      id: (session._id as any).toString(),
      deviceId: session.deviceId.toString(),
    },
  };
}

/**
 * Helper: Perform Google login for existing account
 */
async function performGoogleLogin(
  account: any,
  googleUser: GoogleUserInfo,
  deviceInfo: any,
  clientIP: string
) {
  // Check if account is active
  if (!account.isActive) {
    throw new AuthenticationError('Account is inactive');
  }

  // Check if banned
  if (account.isBanned()) {
    throw new AuthenticationError('Account is banned');
  }

  // Check if locked
  if (account.isLocked()) {
    throw new AuthenticationError('Account is locked');
  }

  // Update provider last login
  const providerIndex = account.providers.findIndex((p: any) => p.provider === 'google');
  if (providerIndex >= 0) {
    account.providers[providerIndex].lastLogin = new Date();
    await account.save();
  }

  // Find or create device
  const device = await Device.findByIdentifier(deviceInfo.identifier);
  let deviceId;

  if (device) {
    device.updateLastSeen();
    deviceId = device._id;
  } else {
    const newDevice = await Device.create({
      ...deviceInfo,
      userId: account.userId,
    });
    deviceId = newDevice._id;
  }

  // Create session (will generate token after)
  const session = await Session.create({
    userId: account.userId,
    deviceId: deviceId,
    refreshToken: 'temp', // Placeholder
    isActive: true,
    lastLogin: new Date(),
    ipAddress: clientIP,
    userAgent: deviceInfo.userAgent || '',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  // OPTIMIZED: Generate tokens and fetch user in parallel
  const refreshTokenJWT = signRefreshToken((account.userId as any).toString(), (session._id as any).toString());
  const hashedRefreshToken = await hashTokenForDatabase(refreshTokenJWT);

  // Update session with hashed token and get user info in parallel
  const [, user] = await Promise.all([
    (async () => {
      session.refreshToken = hashedRefreshToken;
      await session.save();
    })(),
    User.findById(new mongoose.Types.ObjectId(account.userId)).select('firstName lastName username fullName avatar'),
  ]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Generate access token
  const accessToken = signAccessToken(
    (account.userId as any).toString(),
    account.email,
    (session._id as any).toString()
  );

  return {
    accessToken,
    refreshToken: refreshTokenJWT,
    user: {
      id: (user._id as any).toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      fullName: user.fullName,
      email: account.email,
      avatar: user.avatar,
    },
    session: {
      id: (session._id as any).toString(),
      deviceId: session.deviceId.toString(),
    },
  };
}

