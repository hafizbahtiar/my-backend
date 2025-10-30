/**
 * Environment Configuration
 * 
 * This file validates and exports environment variables.
 * It throws errors if required variables are missing.
 */

import { createTable } from '../utils/table';

/**
 * Validates that required environment variables are set
 */
function validateEnv(): void {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
  ];

  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }
}

// Validate environment on module load
validateEnv();

/**
 * OAuth configuration (optional)
 */
export const oauthConfig = {
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || '',
  googleScopes: process.env.GOOGLE_SCOPES || '',
  googleTokenUri: process.env.GOOGLE_TOKEN_URI || '',
  googleAuthUri: process.env.GOOGLE_AUTH_URI || '',
  googleUserInfoUri: process.env.GOOGLE_USER_INFO_URI || '',
  googleUserInfoEmail: process.env.GOOGLE_USER_INFO_EMAIL || '',
  googleUserInfoName: process.env.GOOGLE_USER_INFO_NAME || '',
};

/**
 * Storage/File upload configuration (optional)
 */
export const storageConfig = {
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB default
  provider: process.env.STORAGE_PROVIDER || 'local', // local | s3 | cloudinary
};

/**
 * Database configuration
 */
export const dbConfig = {
  uri: process.env.MONGODB_URI!,
};

/**
 * JWT configuration
 */
export const jwtConfig = {
  secret: process.env.JWT_SECRET!,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
};

/**
 * Server configuration
 */
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

/**
 * Email configuration (optional - for password reset, verification, etc.)
 */
export const emailConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  from: process.env.SMTP_FROM || '',
  fromName: process.env.SMTP_FROM_NAME || 'Template Backend',
  baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  enabled: !!process.env.SMTP_HOST,
};

/**
 * Security configuration
 */
export const securityConfig = {
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  argon2Memory: parseInt(process.env.ARGON2_MEMORY || '65536', 10),
  argon2Time: parseInt(process.env.ARGON2_TIME || '3', 10),
  argon2Parallelism: parseInt(process.env.ARGON2_PARALLELISM || '4', 10),
};

/**
 * Redis configuration (optional)
 */
export const redisConfig = {
  url: process.env.REDIS_URL || '',
  enabled: !!process.env.REDIS_URL,
};


/**
 * Log all configuration (hide sensitive values)
 */
if (serverConfig.isDevelopment) {
  console.log('\nENVIRONMENT CONFIGURATION');

  // App Settings
  const appSettings = [
    { label: 'Node Environment', value: serverConfig.nodeEnv },
    { label: 'Port', value: serverConfig.port.toString() },
    { label: 'MongoDB URI', value: dbConfig.uri.substring(0, 20) + '...' },
  ];

  createTable('APP SETTINGS', appSettings);

  // Security Settings
  const securitySettings = [
    { label: 'JWT Secret', value: jwtConfig.secret.length >= 32 ? '🟢 Set' : '🔴 Too short' },
    { label: 'Access Token Expiry', value: jwtConfig.accessTokenExpiry },
    { label: 'Refresh Token Expiry', value: jwtConfig.refreshTokenExpiry },
  ];

  createTable('SECURITY', securitySettings);

  // Services
  const services = [
    {
      label: 'Google OAuth',
      value: oauthConfig.googleClientId
        ? `🟢 Enabled (${oauthConfig.googleClientId.substring(0, 8)}...)`
        : '🔴 Not configured'
    },
    {
      label: 'Google Client Secret',
      value: oauthConfig.googleClientSecret
        ? `🟢 Enabled (${oauthConfig.googleClientSecret.substring(0, 8)}...)`
        : '🔴 Not configured'
    },
    {
      label: 'Google Redirect URI',
      value: oauthConfig.googleRedirectUri
        ? `🟢 Enabled (${oauthConfig.googleRedirectUri})`
        : '🔴 Not configured'
    },
    {
      label: 'Google Scopes',
      value: oauthConfig.googleScopes
        ? `🟢 Enabled (${oauthConfig.googleScopes})`
        : '🔴 Not configured'
    },
    {
      label: 'Google Token URI',
      value: oauthConfig.googleTokenUri
        ? `🟢 Enabled (${oauthConfig.googleTokenUri})`
        : '🔴 Not configured'
    },
    {
      label: 'Google Auth URI',
      value: oauthConfig.googleAuthUri
        ? `🟢 Enabled (${oauthConfig.googleAuthUri})`
        : '🔴 Not configured'
    },
    {
      label: 'Google User Info URI',
      value: oauthConfig.googleUserInfoUri
        ? `🟢 Enabled (${oauthConfig.googleUserInfoUri})`
        : '🔴 Not configured'
    },
    {
      label: 'Google User Info Email',
      value: oauthConfig.googleUserInfoEmail
        ? `🟢 Enabled (${oauthConfig.googleUserInfoEmail})`
        : '🔴 Not configured'
    },
    {
      label: 'Google User Info Name',
      value: oauthConfig.googleUserInfoName
        ? `🟢 Enabled (${oauthConfig.googleUserInfoName})`
        : '🔴 Not configured'
    },
    {
      label: 'Email Service',
      value: emailConfig.enabled
        ? `🟢 Enabled (${emailConfig.host})`
        : '🔴 Not configured'
    },
    {
      label: 'File Storage',
      value: `${storageConfig.provider} (${Math.round(storageConfig.maxSize / 1024 / 1024)}MB max)`
    },
    {
      label: 'CORS Origins',
      value: securityConfig.corsOrigin === '*' ? 'All origins' : `${securityConfig.corsOrigin.split(',').length} origin(s)`
    },
    {
      label: 'Redis',
      value: redisConfig.enabled ? `🟢 Enabled` : '🔴 Not configured',
    },
  ];

  createTable('SERVICES', services);
}

