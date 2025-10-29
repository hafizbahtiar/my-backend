import { Hono } from 'hono';
import { register, login, refreshAccessToken, logout, verifyEmail, requestPasswordReset, confirmPasswordReset, changePassword, resendVerificationEmail, verifyEmailWithToken, deleteAccount } from '../services/auth.service';
import { loginWithGoogle, linkGoogleAccount, unlinkGoogleAccount } from '../services/google-oauth.service';
import { loginRateLimit, strictRateLimit, apiRateLimit } from '../middleware/rate-limit';
import { auth, authWithSession } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../utils/errors';

const authRoutes = new Hono();

/**
 * POST /api/auth/register
 * Register a new user
 */
authRoutes.post('/register', loginRateLimit, async (c) => {
  try {
    const { email, password, firstName, lastName, username } = await c.req.json();

    if (!email || !password || !firstName || !lastName || !username) {
      return c.json(createErrorResponse('Missing required fields'), 400);
    }

    const result = await register(email, password, firstName, lastName, username, c.req.raw);

    return c.json({
      success: true,
      data: result,
    }, 201);
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
authRoutes.post('/login', loginRateLimit, async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json(createErrorResponse('Email and password are required'), 400);
    }

    // Get device info from headers
    const deviceInfo = {
      platform: c.req.header('x-platform') || 'web',
      deviceModel: c.req.header('x-device-model') || 'unknown',
      brand: c.req.header('x-device-brand') || 'unknown',
      manufacturer: c.req.header('x-device-manufacturer') || 'unknown',
      osVersion: c.req.header('x-os-version') || 'unknown',
      deviceName: c.req.header('x-device-name') || 'unknown',
      isPhysicalDevice: c.req.header('x-is-physical-device') === 'true' || false,
      identifier: c.req.header('x-device-identifier') || 'unknown',
      fingerprint: c.req.header('x-device-fingerprint') || 'unknown',
      userAgent: c.req.header('user-agent') || '',
    };

    // Get client IP
    const clientIP = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';

    const result = await login(email, password, deviceInfo, clientIP, c.req.raw);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 401);
  }
});

/**
 * POST /api/auth/google
 * Login with Google OAuth
 */
authRoutes.post('/google', loginRateLimit, async (c) => {
  try {
    const { idToken, deviceInfo } = await c.req.json();

    if (!idToken) {
      return c.json(createErrorResponse('ID token is required'), 400);
    }

    const deviceInfoWithDefaults = {
      platform: deviceInfo?.platform || 'mobile',
      deviceModel: deviceInfo?.deviceModel || 'unknown',
      brand: deviceInfo?.brand || 'unknown',
      manufacturer: deviceInfo?.manufacturer || 'unknown',
      osVersion: deviceInfo?.osVersion || 'unknown',
      deviceName: deviceInfo?.deviceName || 'unknown',
      isPhysicalDevice: deviceInfo?.isPhysicalDevice || true,
      identifier: deviceInfo?.identifier || 'unknown',
      fingerprint: deviceInfo?.fingerprint || 'unknown',
      userAgent: c.req.header('user-agent') || '',
    };

    const clientIP = c.req.header('x-forwarded-for') || 
                     c.req.header('x-real-ip') || 
                     'unknown';

    const result = await loginWithGoogle(idToken, deviceInfoWithDefaults, clientIP);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    // Special handling for EMAIL_EXISTS_PASSWORD
    if (error.message === 'EMAIL_EXISTS_PASSWORD') {
      return c.json({
        success: false,
        error: {
          message: error.message,
          code: 'AuthenticationError',
        },
      }, 401);
    }
    return c.json(createErrorResponse(error.message), 401);
  }
});

/**
 * POST /api/auth/link-google
 * Link Google account to existing account
 */
authRoutes.post('/link-google', auth, strictRateLimit, async (c) => {
  try {
    const { idToken, password } = await c.req.json();

    if (!idToken || !password) {
      return c.json(createErrorResponse('ID token and password are required'), 400);
    }

    const result = await linkGoogleAccount((c as any).user.userId, idToken, password);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/unlink-google
 * Unlink Google account
 */
authRoutes.post('/unlink-google', auth, strictRateLimit, async (c) => {
  try {
    const result = await unlinkGoogleAccount((c as any).user.userId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
authRoutes.post('/refresh', loginRateLimit, async (c) => {
  try {
    const { refreshToken } = await c.req.json();

    if (!refreshToken) {
      return c.json(createErrorResponse('Refresh token is required'), 400);
    }

    const result = await refreshAccessToken(refreshToken);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 401);
  }
});

/**
 * POST /api/auth/logout
 * Logout and deactivate session
 */
authRoutes.post('/logout', authWithSession, async (c) => {
  try {
    const result = await logout((c as any).user.sessionId, c.req.raw);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
authRoutes.post('/verify-email', strictRateLimit, async (c) => {
  try {
    const { accountId } = await c.req.json();

    if (!accountId) {
      return c.json(createErrorResponse('Account ID is required'), 400);
    }

    const result = await verifyEmail(accountId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/password-reset/request
 * Request password reset
 */
authRoutes.post('/password-reset/request', strictRateLimit, async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(createErrorResponse('Email is required'), 400);
    }

    const result = await requestPasswordReset(email);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/password-reset/confirm
 * Confirm password reset with token
 */
authRoutes.post('/password-reset/confirm', strictRateLimit, async (c) => {
  try {
    const { resetToken, newPassword } = await c.req.json();

    if (!resetToken || !newPassword) {
      return c.json(createErrorResponse('Reset token and new password are required'), 400);
    }

    const result = await confirmPasswordReset(resetToken, newPassword);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * PUT /api/auth/change-password
 * Change password for logged-in user
 */
authRoutes.put('/change-password', auth, strictRateLimit, async (c) => {
  try {
    const { oldPassword, newPassword } = await c.req.json();

    if (!oldPassword || !newPassword) {
      return c.json(createErrorResponse('Old password and new password are required'), 400);
    }

    const result = await changePassword((c as any).user.userId, oldPassword, newPassword);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
authRoutes.post('/resend-verification', strictRateLimit, async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json(createErrorResponse('Email is required'), 400);
    }

    const result = await resendVerificationEmail(email);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * POST /api/auth/verify-email/confirm
 * Verify email using token
 */
authRoutes.post('/verify-email/confirm', strictRateLimit, async (c) => {
  try {
    const { verificationToken } = await c.req.json();

    if (!verificationToken) {
      return c.json(createErrorResponse('Verification token is required'), 400);
    }

    const result = await verifyEmailWithToken(verificationToken);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

/**
 * DELETE /api/auth/account
 * Delete user account (soft delete)
 */
authRoutes.delete('/account', auth, strictRateLimit, async (c) => {
  try {
    const { password } = await c.req.json();

    if (!password) {
      return c.json(createErrorResponse('Password is required for account deletion'), 400);
    }

    const result = await deleteAccount((c as any).user.userId, password, c.req.raw);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(createErrorResponse(error.message), 400);
  }
});

export default authRoutes;

