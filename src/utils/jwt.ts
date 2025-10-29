import * as jwt from 'jsonwebtoken';

/**
 * JWT Token Payload Interfaces
 */

export interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sessionId: string;
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Configuration
 */

// Default expiration times
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Secret key (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production-min-32-chars';

/**
 * Sign/Generate Access Token (JWT)
 * 
 * Access tokens are short-lived JWT tokens sent to the client
 * Used for authenticated API requests
 * 
 * @param userId - User's ID (ObjectId as string)
 * @param email - User's email
 * @param sessionId - Session ID (ObjectId as string)
 * @returns Promise<string> - Signed JWT access token
 * 
 * @example
 * ```ts
 * const accessToken = await signAccessToken(
 *   user._id.toString(),
 *   account.email,
 *   session._id.toString()
 * );
 * ```
 */
export function signAccessToken(
  userId: string,
  email: string,
  sessionId: string
): string {
  try {
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    const payload: AccessTokenPayload = {
      userId,
      email,
      sessionId,
    };

    const options: any = {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256', // HMAC SHA-256
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);

    return token;
  } catch (error) {
    throw new Error(`Access token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sign/Generate Refresh Token (JWT)
 * 
 * Refresh tokens are long-lived JWT tokens.
 * 
 * **Token Flow:**
 * 1. Generate JWT using this function (jwt.ts)
 * 2. Hash the JWT token using `hashTokenForDatabase()` from password.ts
 * 3. Store hashed token in database
 * 4. Send plain JWT to client in HTTP-only cookie
 * 
 * **Verification Flow:**
 * 1. Verify JWT signature using `verifyRefreshToken()` from jwt.ts
 * 2. Verify hash match using `verifyTokenHash()` from password.ts
 * 
 * @param userId - User's ID (ObjectId as string)
 * @param sessionId - Session ID (ObjectId as string)
 * @returns string - Signed JWT refresh token
 * 
 * @example
 * ```ts
 * import { hashTokenForDatabase } from './password';
 * 
 * // Generate JWT
 * const refreshToken = signRefreshToken(userId, sessionId);
 * 
 * // Hash before storing
 * const hashedToken = await hashTokenForDatabase(refreshToken);
 * await Session.create({ refreshToken: hashedToken });
 * 
 * // Return plain JWT to client
 * ```
 */
export function signRefreshToken(
  userId: string,
  sessionId: string
): string {
  try {
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    const payload: RefreshTokenPayload = {
      userId,
      sessionId,
    };

    const options: any = {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    };
    
    const token = jwt.sign(payload, JWT_SECRET, options);

    return token;
  } catch (error) {
    throw new Error(`Refresh token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify Access Token
 * 
 * Verifies and decodes an access token
 * Returns the payload if valid, throws error if invalid
 * 
 * @param token - JWT access token to verify
 * @returns AccessTokenPayload - Decoded token payload
 * @throws Error if token is invalid or expired
 * 
 * @example
 * ```ts
 * try {
 *   const payload = verifyAccessToken(token);
 *   console.log('User ID:', payload.userId);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 * ```
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as AccessTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Verify Refresh Token
 * 
 * Verifies and decodes a refresh token
 * Returns the payload if valid, throws error if invalid
 * 
 * @param token - JWT refresh token to verify
 * @returns RefreshTokenPayload - Decoded token payload
 * @throws Error if token is invalid or expired
 * 
 * @example
 * ```ts
 * try {
 *   const payload = verifyRefreshToken(token);
 *   console.log('Session ID:', payload.sessionId);
 * } catch (error) {
 *   console.error('Invalid refresh token');
 * }
 * ```
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    if (!token) {
      throw new Error('Token is required');
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Decode Token Without Verification
 * 
 * Decodes a JWT token without verifying signature
 * Use this only for extracting data from a token you trust
 * ⚠️ DO NOT use for authentication
 * 
 * @param token - JWT token to decode
 * @returns Decoded token payload (unverified)
 * 
 * @example
 * ```ts
 * const payload = decodeToken(token);
 * console.log('Expires at:', new Date(payload.exp! * 1000));
 * ```
 */
export function decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload | null {
  try {
    return jwt.decode(token) as AccessTokenPayload | RefreshTokenPayload | null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if Token is Expired (without verification)
 * 
 * @param token - JWT token to check
 * @returns boolean - True if expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }

  // Compare with current time (in seconds)
  return Date.now() >= decoded.exp * 1000;
}

/**
 * Get Token Expiration Time
 * 
 * @param token - JWT token
 * @returns Date | null - Expiration date or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return null;
  }

  return new Date(decoded.exp * 1000);
}

/**
 * Extract Token from Authorization Header
 * 
 * Extracts Bearer token from "Authorization: Bearer <token>" header
 * 
 * @param authHeader - Authorization header value
 * @returns string | null - Token or null if invalid format
 * 
 * @example
 * ```ts
 * const token = extractTokenFromHeader(req.headers.authorization);
 * if (token) {
 *   const payload = verifyAccessToken(token);
 * }
 * ```
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Check if it starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Extract token part
  const token = authHeader.substring(7); // Remove "Bearer "
  
  return token.trim() || null;
}

/**
 * JWT Configuration Exports
 */
export const JWT_CONFIG = {
  secret: JWT_SECRET,
  accessTokenExpiry: ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: REFRESH_TOKEN_EXPIRY,
  algorithm: 'HS256' as const,
};

