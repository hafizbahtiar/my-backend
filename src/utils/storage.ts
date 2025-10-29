import * as path from 'path';
import { readFile, writeFile, unlink, mkdir } from 'fs/promises';

/**
 * Storage Utilities
 * 
 * Helper functions for file upload, validation, and management
 */

/**
 * Generate a unique, safe filename
 * Format: {prefix}-{userId}-{timestamp}-{randomId}.{ext}
 */
export function generateFileName(
  originalName: string,
  userId: string,
  prefix: string = 'file'
): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 12);
  
  return `${prefix}-${userId}-${timestamp}-${randomId}${ext}`;
}

/**
 * Validate file type
 */
export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function validateFileSize(
  size: number,
  maxSize: number
): boolean {
  return size <= maxSize;
}

/**
 * Get file URL from file path
 */
export function getFileUrl(filePath: string): string {
  // Remove leading './' or './uploads'
  const cleanPath = filePath.replace(/^\.\//, '').replace(/^\.\/uploads\//, '');
  
  // For local storage, return relative URL
  return `/uploads/${cleanPath}`;
}

/**
 * Get full file path for storage
 */
export function getFullFilePath(fileName: string, uploadDir: string = './uploads'): string {
  // Ensure upload directory exists
  return path.join(uploadDir, fileName);
}

/**
 * Delete file from filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error: any) {
    // File doesn't exist or already deleted - that's okay
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Ensure upload directory exists
 */
export async function ensureUploadDir(uploadDir: string = './uploads'): Promise<void> {
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Get file size in readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitize filename to prevent directory traversal and special characters
 */
export function sanitizeFileName(filename: string): string {
  // Remove any path components
  const basename = path.basename(filename);
  
  // Remove special characters except dots, hyphens, underscores
  return basename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if file is a document
 */
export function isDocumentFile(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
  ];
  return documentTypes.includes(mimeType);
}

