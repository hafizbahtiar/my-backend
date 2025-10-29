import { OAuth2Client } from 'google-auth-library';

/**
 * Google OAuth Token Verification
 * 
 * Verifies Google ID tokens from Flutter/mobile applications
 */

/**
 * Google user info extracted from ID token
 */
export interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
}

/**
 * Verify Google ID Token
 * 
 * Validates the JWT signature and extracts user information
 * 
 * @param idToken - Google ID Token from Flutter
 * @param clientId - Google OAuth Client ID (optional, uses env var if not provided)
 * @returns Google user information
 * @throws Error if token is invalid
 * 
 * @example
 * ```ts
 * import { verifyGoogleToken } from '@/utils/google-oauth';
 * 
 * const userInfo = await verifyGoogleToken(idToken);
 * ```
 */
export async function verifyGoogleToken(
  idToken: string,
  clientId?: string
): Promise<GoogleUserInfo> {
  try {
    // Get client ID from parameter or environment
    const googleClientId = clientId || process.env.GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
      throw new Error('Google Client ID not configured. Set GOOGLE_CLIENT_ID environment variable.');
    }

    // Create OAuth2 client
    const client = new OAuth2Client(googleClientId);

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    // Get payload
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Failed to extract payload from Google token');
    }

    // Validate required fields
    if (!payload.sub || !payload.email) {
      throw new Error('Invalid Google token: missing required fields');
    }

    // Extract and return user info
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Google token verification failed: ${error.message}`);
    }
    throw new Error('Google token verification failed: Unknown error');
  }
}

/**
 * Check if Google token verification is available
 * 
 * @returns true if GOOGLE_CLIENT_ID is configured
 */
export function isGoogleOAuthEnabled(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID;
}

