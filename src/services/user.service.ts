import User from '../models/User';
import Account from '../models/Account';
import File from '../models/File';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';
import {
  generateFileName,
  validateFileType,
  validateFileSize,
  getFileUrl,
  getFullFilePath,
  ensureUploadDir,
  deleteFile,
} from '../utils/storage';
import { ALLOWED_IMAGE_TYPES, UPLOAD_DIR } from '../config/storage';
import mongoose from 'mongoose';
import { writeFile } from 'fs/promises';
/**
 * User Service
 * 
 * Handles user profile operations
 */

/**
 * Get user profile by ID
 * OPTIMIZED: Run user and account queries in parallel
 */
export async function getUserProfile(userId: string) {
  // Run both queries in parallel for better performance
  const [user, accountResult] = await Promise.all([
    User.findById(new mongoose.Types.ObjectId(userId)).select('firstName lastName username fullName avatar phoneNumber bio createdAt updatedAt'),
    Account.findByUserId(new mongoose.Types.ObjectId(userId)),
  ]);
  
  const account = accountResult ? {
    email: accountResult.email,
    isEmailVerified: accountResult.isEmailVerified,
    isPhoneVerified: accountResult.isPhoneVerified,
  } : null;

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: (user._id as any).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    phoneNumber: user.phoneNumber,
    bio: user.bio,
    email: account?.email,
    emailVerified: account?.isEmailVerified,
    phoneVerified: account?.isPhoneVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
    phoneNumber?: string;
    avatar?: string;
  }
) {
  const user = await User.findById(new mongoose.Types.ObjectId(userId));
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if username is changing and available
  if (updateData.username && updateData.username !== user.username) {
    const usernameAvailable = await User.isUsernameAvailable(updateData.username);
    if (!usernameAvailable) {
      throw new ConflictError('Username already taken');
    }
    user.username = updateData.username;
  }

  // Update other fields
  if (updateData.firstName) user.firstName = updateData.firstName;
  if (updateData.lastName) user.lastName = updateData.lastName;
  if (updateData.bio) user.bio = updateData.bio;
  if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
  if (updateData.avatar) user.avatar = updateData.avatar;

  await user.save();

  return {
    id: (user._id as any).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    phoneNumber: user.phoneNumber,
    bio: user.bio,
    updatedAt: user.updatedAt,
  };
}

/**
 * Search users by name or username
 */
export async function searchUsers(query: string, limit: number = 10) {
  if (!query || query.length < 2) {
    throw new ValidationError('Search query must be at least 2 characters');
  }

  const users = await User.searchByFullName(query);

  return users.slice(0, limit).map((user: any) => ({
    id: (user._id as any).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
  }));
}

/**
 * Get user by username
 */
export async function getUserByUsername(username: string) {
  const user = await User.findByUsername(username);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  return {
    id: (user._id as any).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    fullName: user.fullName,
    avatar: user.avatar,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string) {
  const available = await User.isUsernameAvailable(username);
  return { available };
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  userId: string,
  file: File,
  buffer: Buffer
) {
  // Validate file type
  if (!validateFileType(file.type || 'application/octet-stream', ALLOWED_IMAGE_TYPES)) {
    throw new ValidationError('Only image files are allowed for avatars');
  }

  // Validate file size (max 2MB for avatars)
  if (!validateFileSize(file.size, 2 * 1024 * 1024)) {
    throw new ValidationError('Avatar file size must be less than 2MB');
  }

  // Ensure upload directory exists
  await ensureUploadDir(UPLOAD_DIR);

  // Generate unique filename
  const fileName = generateFileName(file.name, userId, 'avatar');
  const filePath = getFullFilePath(fileName, UPLOAD_DIR);
  const url = getFileUrl(fileName);

  // OPTIMIZED: Run file save and user query in parallel
  const [user] = await Promise.all([
    User.findById(new mongoose.Types.ObjectId(userId)).select('avatar'),
    writeFile(filePath, buffer),
  ]);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Delete old avatar if exists (async - fire and forget)
  if (user.avatar) {
    deleteFile(user.avatar).catch(err => console.error('Failed to delete old avatar:', err));
  }

  // Create file record in database
  const fileRecord = await File.create({
    userId: new mongoose.Types.ObjectId(userId),
    fileName,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    category: 'image',
    size: file.size,
    path: filePath,
    url,
    uploadedBy: new mongoose.Types.ObjectId(userId),
  });

  // Update user avatar
  user.avatar = url;
  await user.save();

  return {
    id: (fileRecord._id as any).toString(),
    fileName: fileRecord.fileName,
    originalName: fileRecord.originalName,
    url: fileRecord.url,
    size: fileRecord.size,
    mimeType: fileRecord.mimeType,
    category: fileRecord.category,
    createdAt: fileRecord.createdAt,
  };
}

