import type { Context, Next } from 'hono';
import { verifyAccessToken, extractTokenFromHeader, type AccessTokenPayload } from '../utils/jwt';
import { AuthenticationError } from '../utils/errors';
import Account from '../models/Account';
import Session from '../models/Session';
import mongoose from 'mongoose';

/**
 * Extend Hono Context with user information
 */
export interface AuthContext extends Context {
  user: {
    userId: string;
    email: string;
    sessionId: string;
  };
  account?: any; // Account document
  session?: any; // Session document
}

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT access token and attaches user info to context
 * 
 * @example
 * ```ts
 * import { auth } from '@/middleware/auth';
 * 
 * app.get('/protected', auth, (c) => {
 *   return c.json({ userId: c.user.userId });
 * });
 * ```
 */
export async function auth(c: Context, next: Next) {
  try {
    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    // Verify JWT signature and expiration
    let payload: AccessTokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      throw new AuthenticationError(
        error instanceof Error ? error.message : 'Invalid or expired token'
      );
    }

    // Attach user info to context
    const authContext = c as AuthContext;
    authContext.user = {
      userId: payload.userId,
      email: payload.email,
      sessionId: payload.sessionId,
    };

    // Continue to next middleware/handler
    await next();
  } catch (error) {
    // Return error response
    if (error instanceof AuthenticationError) {
      return c.json({
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      }, 401);
    }

    // Unknown error
    console.error('Auth middleware error:', error);
    return c.json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AuthenticationError',
      },
    }, 401);
  }
}

/**
 * JWT Authentication with Account Verification
 * 
 * Verifies JWT AND checks if account exists and is active
 * Attaches both user info and account document to context
 * 
 * @example
 * ```ts
 * import { authWithAccount } from '@/middleware/auth';
 * 
 * app.get('/profile', authWithAccount, (c) => {
 *   return c.json({ account: c.account });
 * });
 * ```
 */
export async function authWithAccount(c: Context, next: Next) {
  try {
    // First verify token
    await auth(c, async () => {});

    const authContext = c as AuthContext;

    // Fetch account
    const account = await Account.findById(new mongoose.Types.ObjectId(authContext.user.userId));

    if (!account) {
      throw new AuthenticationError('Account not found');
    }

    // Check if account is active
    if (!account.isActive) {
      throw new AuthenticationError('Account is inactive');
    }

    // Check if account is banned
    if (account.isBanned()) {
      throw new AuthenticationError('Account is banned');
    }

    // Check if account is locked
    if (account.isLocked()) {
      throw new AuthenticationError('Account is locked');
    }

    // Attach account to context
    authContext.account = account;

    // Continue to next middleware/handler
    await next();
  } catch (error) {
    // Return error response
    if (error instanceof AuthenticationError) {
      return c.json({
        success: false,
        error: {
          message: error.message,
          code: 'AuthenticationError',
        },
      }, 401);
    }

    console.error('Auth with account middleware error:', error);
    return c.json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AuthenticationError',
      },
    }, 401);
  }
}

/**
 * JWT Authentication with Session Verification
 * 
 * Verifies JWT AND checks if session exists and is active
 * Attaches both user info and session document to context
 * 
 * @example
 * ```ts
 * import { authWithSession } from '@/middleware/auth';
 * 
 * app.get('/session-info', authWithSession, (c) => {
 *   return c.json({ session: c.session });
 * });
 * ```
 */
export async function authWithSession(c: Context, next: Next) {
  try {
    // First verify token
    await auth(c, async () => {});

    const authContext = c as AuthContext;

    // Fetch session
    const session = await Session.findById(authContext.user.sessionId);

    if (!session) {
      throw new AuthenticationError('Session not found');
    }

    // Check if session is active
    if (!session.isActive) {
      throw new AuthenticationError('Session is inactive');
    }

    // Check if session expired
    if (session.isExpired()) {
      throw new AuthenticationError('Session has expired');
    }

    // Attach session to context
    authContext.session = session;

    // Continue to next middleware/handler
    await next();
  } catch (error) {
    // Return error response
    if (error instanceof AuthenticationError) {
      return c.json({
        success: false,
        error: {
          message: error.message,
          code: 'AuthenticationError',
        },
      }, 401);
    }

    console.error('Auth with session middleware error:', error);
    return c.json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AuthenticationError',
      },
    }, 401);
  }
}

/**
 * Combined: JWT + Account + Session Verification
 * 
 * Verifies JWT, account, AND session
 * Most secure but has most database queries
 * 
 * @example
 * ```ts
 * import { authComplete } from '@/middleware/auth';
 * 
 * app.get('/secure', authComplete, (c) => {
 *   return c.json({ 
 *     user: c.user, 
 *     account: c.account, 
 *     session: c.session 
 *   });
 * });
 * ```
 */
export async function authComplete(c: Context, next: Next) {
  try {
    // Run auth with account
    await authWithAccount(c, async () => {});

    const authContext = c as AuthContext;

    // Fetch session
    const session = await Session.findById(authContext.user.sessionId);

    if (!session) {
      throw new AuthenticationError('Session not found');
    }

    // Check if session is active
    if (!session.isActive) {
      throw new AuthenticationError('Session is inactive');
    }

    // Check if session expired
    if (session.isExpired()) {
      throw new AuthenticationError('Session has expired');
    }

    // Attach session to context
    authContext.session = session;

    // Continue to next middleware/handler
    await next();
  } catch (error) {
    // Return error response
    if (error instanceof AuthenticationError) {
      return c.json({
        success: false,
        error: {
          message: error.message,
          code: 'AuthenticationError',
        },
      }, 401);
    }

    console.error('Auth complete middleware error:', error);
    return c.json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AuthenticationError',
      },
    }, 401);
  }
}

