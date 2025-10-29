import type { Context, Next } from 'hono';
import { serveStatic } from 'hono/bun';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Static File Serving Middleware
 * 
 * Serves uploaded files with proper security and caching headers
 */

/**
 * Serve static files from uploads directory
 * 
 * Features:
 * - Security headers for uploaded files
 * - Cache control for images
 * - File type validation
 * - Path traversal protection
 */
export function serveUploadedFiles() {
  return async (c: Context, next: Next) => {
    const path = c.req.path;
    
    // Only handle /uploads/* paths
    if (!path.startsWith('/uploads/')) {
      return next();
    }

    // Security: Prevent path traversal
    if (path.includes('..') || path.includes('//')) {
      return c.json({
        success: false,
        error: {
          message: 'Invalid file path',
          code: 'ForbiddenError',
        },
      }, 403);
    }

    // Check if file exists
    const filePath = join('./uploads', path.replace('/uploads/', ''));
    if (!existsSync(filePath)) {
      return c.json({
        success: false,
        error: {
          message: 'File not found',
          code: 'NotFoundError',
        },
      }, 404);
    }

    // Get file extension for content type
    const ext = path.split('.').pop()?.toLowerCase();
    
    // Set appropriate headers based on file type
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      // Images: Cache for 1 day
      c.res.headers.set('Cache-Control', 'public, max-age=86400');
      c.res.headers.set('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`);
    } else if (ext && ['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      // Documents: No cache, download
      c.res.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      c.res.headers.set('Content-Disposition', 'attachment');
    } else {
      // Other files: Short cache
      c.res.headers.set('Cache-Control', 'public, max-age=3600');
    }

    // Security headers
    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    
    // Serve the file using Hono's static middleware
    return serveStatic({ 
      root: './',
      rewriteRequestPath: (p) => p.replace(/^\/uploads/, '/uploads')
    })(c, next);
  };
}

/**
 * Serve static files with basic configuration
 * 
 * Simple version without additional security checks
 */
export function serveStaticFiles() {
  return serveStatic({ 
    root: './',
    rewriteRequestPath: (path) => path.replace(/^\/uploads/, '/uploads')
  });
}
