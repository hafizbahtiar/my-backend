import { storageConfig } from './env';

/**
 * Storage Configuration
 * 
 * Centralized configuration for file uploads and storage
 */

export const UPLOAD_DIR = storageConfig.uploadPath || './uploads';
export const MAX_FILE_SIZE = storageConfig.maxSize || 5 * 1024 * 1024; // 5MB default

// Allowed file types by category
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
];

// File type categories
export type FileCategory = 'image' | 'document' | 'video' | 'other';

export const FILE_CATEGORIES: Record<FileCategory, string[]> = {
  image: ALLOWED_IMAGE_TYPES,
  document: ALLOWED_DOCUMENT_TYPES,
  video: ALLOWED_VIDEO_TYPES,
  other: [],
};

/**
 * Get allowed types for a specific category
 */
export function getAllowedTypes(category: FileCategory): string[] {
  return FILE_CATEGORIES[category];
}

/**
 * Get category from mime type
 */
export function getCategoryFromMimeType(mimeType: string): FileCategory {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image';
  if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document';
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video';
  return 'other';
}

