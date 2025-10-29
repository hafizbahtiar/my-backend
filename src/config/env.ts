/**
 * Environment Configuration
 * 
 * This file validates and exports environment variables.
 * It throws errors if required variables are missing.
 */

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
 * Log all configuration (hide sensitive values)
 */
if (serverConfig.isDevelopment) {
  console.log('📋 Environment Configuration:');
  console.log('   Node Environment:', serverConfig.nodeEnv);
  console.log('   Port:', serverConfig.port);
  console.log('   MongoDB URI:', dbConfig.uri.substring(0, 20) + '...');
  console.log('   JWT Secret:', jwtConfig.secret.length >= 32 ? '✅ Set' : '⚠️ Too short');
  console.log('   Access Token Expiry:', jwtConfig.accessTokenExpiry);
  console.log('   Refresh Token Expiry:', jwtConfig.refreshTokenExpiry);
  console.log('   Google OAuth:', oauthConfig.googleClientId ? '✅ Enabled' : '⚠️ Not configured');
  console.log('   Email Service:', emailConfig.enabled ? '✅ Enabled' : '⚠️ Not configured');
}

