import * as argon2 from 'argon2';

/**
 * Configuration for Argon2id password hashing
 * Based on OWASP recommendations and security best practices
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,        // Argon2id (resistant to both GPU and side-channel attacks)
  memoryCost: 65536,            // 64 MB (in KiB)
  timeCost: 3,                  // 3 iterations
  parallelism: 4,               // 4 threads
  hashLength: 32,               // 32 bytes output
};

/**
 * Hash a password using Argon2id
 * 
 * @param plainPassword - The plain text password to hash
 * @returns Promise<string> - The hashed password
 * 
 * @example
 * ```ts
 * const hashedPassword = await hashPassword('mySecurePassword123');
 * ```
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    if (!plainPassword || plainPassword.length === 0) {
      throw new Error('Password cannot be empty');
    }

    if (plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const hashedPassword = await argon2.hash(plainPassword, ARGON2_OPTIONS);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a password against a hash
 * 
 * @param hashedPassword - The stored hash from database
 * @param plainPassword - The plain text password to verify
 * @returns Promise<boolean> - True if password matches, false otherwise
 * 
 * @example
 * ```ts
 * const isValid = await verifyPassword(storedHash, 'userInputPassword');
 * if (isValid) {
 *   // Login successful
 * }
 * ```
 */
export async function verifyPassword(
  hashedPassword: string,
  plainPassword: string
): Promise<boolean> {
  try {
    if (!hashedPassword || !plainPassword) {
      return false;
    }

    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    // Log error for security monitoring
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * ⚠️ DEPRECATED: Use JWT utilities instead for refresh tokens
 * 
 * This function is kept for backward compatibility.
 * For refresh tokens, use:
 * - jwt.ts for generating/verifying JWT tokens
 * - This function only for hashing before database storage
 * 
 * @deprecated Use `hashTokenForDatabase()` instead
 */
export async function hashRefreshToken(token: string): Promise<string> {
  console.warn('hashRefreshToken is deprecated. Use hashTokenForDatabase instead.');
  return hashTokenForDatabase(token);
}

/**
 * Hash a token for database storage
 * 
 * This is used to hash JWT refresh tokens before storing in database.
 * The token should first be generated using JWT utilities (jwt.ts).
 * 
 * @param token - The plain token (usually a JWT refresh token)
 * @returns Promise<string> - The hashed token for database storage
 * 
 * @example
 * ```ts
 * import { signRefreshToken } from './jwt';
 * import { hashTokenForDatabase } from './password';
 * 
 * // Generate JWT refresh token
 * const jwtToken = signRefreshToken(userId, sessionId);
 * 
 * // Hash it before storing in database
 * const hashedToken = await hashTokenForDatabase(jwtToken);
 * 
 * // Store hashedToken in database
 * await Session.create({ refreshToken: hashedToken });
 * 
 * // Send jwtToken to client in HTTP-only cookie
 * ```
 */
export async function hashTokenForDatabase(token: string): Promise<string> {
  try {
    if (!token || token.length < 10) {
      throw new Error('Token must be at least 10 characters long');
    }

    const hashedToken = await argon2.hash(token, ARGON2_OPTIONS);
    return hashedToken;
  } catch (error) {
    throw new Error(`Token hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a token against a database hash
 * 
 * This verifies that the token matches the hashed version in the database.
 * Note: This does NOT verify JWT signature - use jwt.ts for that first!
 * 
 * @param hashedToken - The stored hash from database
 * @param token - The plain token to verify
 * @returns Promise<boolean> - True if token matches, false otherwise
 * 
 * @example
 * ```ts
 * import { verifyRefreshToken } from './jwt';
 * import { verifyTokenHash } from './password';
 * 
 * // First verify JWT signature
 * const payload = verifyRefreshToken(token);
 * 
 * // Then verify against database hash
 * const matchesHash = await verifyTokenHash(session.refreshToken, token);
 * 
 * if (matchesHash) {
 *   // Token is valid
 * }
 * ```
 */
export async function verifyTokenHash(
  hashedToken: string,
  token: string
): Promise<boolean> {
  try {
    if (!hashedToken || !token) {
      return false;
    }

    return await argon2.verify(hashedToken, token);
  } catch (error) {
    // Log error for security monitoring
    console.error('Token hash verification failed:', error);
    return false;
  }
}

/**
 * Check if a password needs rehashing
 * Useful for upgrading password hashes when security parameters change
 * 
 * @param hash - The stored hash
 * @returns Promise<boolean> - True if rehashing is needed
 */
export async function needsRehash(hash: string): Promise<boolean> {
  try {
    return await argon2.needsRehash(hash, ARGON2_OPTIONS);
  } catch (error) {
    console.error('Rehash check failed:', error);
    return true; // Default to true for safety
  }
}

/**
 * Password strength requirements
 * 
 * Rules:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character (optional but recommended)
 * 
 * @param password - Password to validate
 * @returns Object with isValid and issues array
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (password.length < 8) {
    issues.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    issues.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    issues.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    issues.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must contain at least one number');
  }

  // Optional but recommended
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push('Password should contain at least one special character (recommended)');
  }

  // Check for common patterns
  const commonPatterns = [
    /password/i,
    /12345/,
    /qwerty/i,
    /admin/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    issues.push('Password contains common insecure patterns');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Generate a cryptographically secure random token
 * 
 * @param length - Length of token in bytes (default: 32)
 * @returns Hexadecimal string representation
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  // Use Bun's crypto API for secure random generation
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Export argon2 configuration for use in other modules
 */
export const ARGON2_CONFIG = {
  ...ARGON2_OPTIONS,
  // Calculate memory cost in different units for documentation
  memoryCostMB: ARGON2_OPTIONS.memoryCost / 1024, // 64 MB
};

