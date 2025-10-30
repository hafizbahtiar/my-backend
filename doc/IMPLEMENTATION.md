# Implementation Guide

**Tech Stack:** Bun + Hono + MongoDB (Mongoose) + TypeScript

Complete implementation guide covering authentication, security, OAuth, services, and utilities.

## Table of Contents

1. [Authentication Middleware](#authentication-middleware)
2. [Password Hashing](#password-hashing)
3. [JWT & Refresh Tokens](#jwt--refresh-tokens)
4. [Rate Limiting](#rate-limiting)
5. [Security Headers & CORS](#security-headers--cors)
6. [Google OAuth](#google-oauth)
7. [Services Layer](#services-layer)
8. [Model-Utility Architecture](#model-utility-architecture)
9. [Media & Uploads](#media--uploads)

---

## Authentication Middleware

### Available Middleware

| Middleware | DB Queries | Use Case |
|-----------|------------|----------|
| `auth` | 0 | Basic JWT verification (fastest) |
| `authWithAccount` | 1 | Need account state (active, not banned) |
| `authWithSession` | 1 | Need session verification |
| `authComplete` | 2 | Maximum security (all checks) |

### Usage

```typescript
import { auth, authWithAccount, authWithSession, authComplete } from '@/middleware/auth';

// Basic JWT verification
app.get('/api/data', auth, (c) => {
  return c.json({ userId: c.user.userId });
});

// With account verification
app.get('/api/profile', authWithAccount, (c) => {
  return c.json({ email: c.account.email });
});

// Complete verification
app.post('/change-password', authComplete, async (c) => {
  // Both account and session verified
});
```

---

## Password Hashing

### Configuration

- **Algorithm:** Argon2id (OWASP recommended)
- **Memory:** 64 MB
- **Time Cost:** 3 iterations
- **Parallelism:** 4 threads

### Usage

```typescript
import { hashPassword, verifyPassword } from '@/utils/password';

// Hash password
const hashedPassword = await hashPassword('MySecureP@ssw0rd123');

// Verify password
const isValid = await verifyPassword(account.password, inputPassword);
```

### Refresh Token Hashing

```typescript
import { hashTokenForDatabase, verifyTokenHash } from '@/utils/password';

// Hash refresh token before storing
const hashedToken = await hashTokenForDatabase(refreshTokenJWT);

// Verify token against database hash
const matches = await verifyTokenHash(storedHash, tokenJWT);
```

---

## JWT & Refresh Tokens

### Token Flow

```
Login
  ↓
1. Generate JWT refresh token (signRefreshToken)
  ↓
2. Hash token (hashTokenForDatabase)
  ↓
3. Store hashed in database
  ↓
4. Return plain JWT to client

Refresh
  ↓
1. Verify JWT signature (verifyRefreshToken)
  ↓
2. Find session by sessionId
  ↓
3. Verify hash (verifyTokenHash)
  ↓
4. Generate new access token
```

### Usage

```typescript
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '@/utils/jwt';

// Generate tokens
const accessToken = signAccessToken(userId, email, sessionId);
const refreshToken = signRefreshToken(userId, sessionId);

// Verify tokens
try {
  const payload = verifyAccessToken(token);
} catch (error) {
  // Invalid token
}
```

---

## Rate Limiting

### Available Limiters

| Limiter | Limit | Window | Use Case |
|---------|-------|--------|----------|
| `loginRateLimit` | 5 | 15 min | Login attempts |
| `apiRateLimit` | 100 | 15 min | General API |
| `strictRateLimit` | 3 | 5 min | Sensitive operations |
| `userRateLimit` | 10 | 1 min | User updates |
| `emailRateLimit` | 3 | 1 hour | Email/SMS |

### Usage

```typescript
import { loginRateLimit, strictRateLimit } from '@/middleware/rate-limit';

app.post('/api/auth/login', loginRateLimit, loginHandler);
app.post('/api/auth/password-reset', strictRateLimit, resetHandler);
```

---

## Account Status Check

Public pre-check endpoint to determine whether an account exists and its basic flags. Useful for onboarding and login UX flows.

Route: `GET /api/auth/account-status?email=... | ?username=...` (exactly one required)

Response examples:
```json
{ "success": true, "data": { "exists": false } }
```
```json
{
  "success": true,
  "data": {
    "exists": true,
    "isActive": true,
    "isEmailVerified": false,
    "hasPassword": true,
    "providers": ["google"]
  }
}
```

Security: Public, but protected by strict rate limiting. Returns no PII beyond existence and flags.

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1738024800000
Retry-After: 900  (when rate limited)
```

---

## Security Headers & CORS

### Security Headers (Automatic)

Using Hono's built-in `secureHeaders()`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### CORS Configuration

```typescript
// Using Hono's built-in CORS
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));
```

### Environment Variable

```env
CORS_ORIGIN=*
# or specific domains
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

---

## Google OAuth

### Mobile Flow (Flutter)

```
1. Flutter: Get Google ID token
2. Flutter: Send ID token to backend
3. Backend: Verify token with Google
4. Backend: Check if account exists
5. Backend: Create or link account
6. Backend: Return JWT tokens
```

### Smart Auto-Linking

```typescript
// Case 1: New user → Create account
// Case 2: Google already linked → Login
// Case 3: Email exists, OAuth-only → Auto-link
// Case 4: Email exists, has password → Require password verification
```

### Usage

```typescript
import { loginWithGoogle, linkGoogleAccount, unlinkGoogleAccount } from '@/services/google-oauth.service';

// Login/Register with Google
const result = await loginWithGoogle(idToken, deviceInfo, clientIP);

// Link Google to existing account
await linkGoogleAccount(userId, idToken, password);

// Unlink Google
await unlinkGoogleAccount(userId);
```

### Configuration

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## Services Layer

### Architecture

```
Route → Service → Models + Utils → Database
```

### Available Services

1. **Auth Service** (`auth.service.ts`)
   - `register()` - User registration
   - `login()` - Authentication
   - `refreshAccessToken()` - Token refresh
   - `logout()` - Session deactivation
   - `verifyEmail()` - Email verification
   - `requestPasswordReset()` - Password reset

2. **Google OAuth Service** (`google-oauth.service.ts`)
   - `loginWithGoogle()` - OAuth login/register
   - `linkGoogleAccount()` - Link Google
   - `unlinkGoogleAccount()` - Unlink Google

3. **User Service** (`user.service.ts`)
   - `getUserProfile()` - Get profile
   - `updateUserProfile()` - Update profile
   - `searchUsers()` - Search users
   - `getUserByUsername()` - Get by username

4. **Session Service** (`session.service.ts`)
   - `getUserSessions()` - List sessions
   - `deactivateSession()` - Deactivate session
   - `deactivateAllUserSessions()` - Logout all
   - `extendSession()` - Extend expiration

5. **Device Service** (`device.service.ts`)
   - `getUserDevices()` - List devices
   - `markDeviceTrusted()` - Mark trusted
   - `markDeviceUntrusted()` - Remove trust
   - `updateDevice()` - Update device
   - `deleteDevice()` - Delete device

### Usage in Routes

```typescript
import { getUserProfile } from '@/services/user.service';
import { auth } from '@/middleware/auth';

app.get('/api/user/profile', auth, async (c) => {
  const profile = await getUserProfile(c.user.userId);
  return c.json({ success: true, data: profile });
});
```

---

## Model-Utility Architecture

### Principle

**Models work with pre-processed data** (hashed passwords, hashed tokens)

### Flow

```
Service/Route (hash password) → Model (store hashed) → Database
```

### Example

```typescript
// ✅ CORRECT: Hash in service
import { hashPassword } from '@/utils/password';

const hashedPassword = await hashPassword(plainPassword);
await Account.create({ password: hashedPassword });

// ❌ WRONG: Model doing hashing
AccountSchema.methods.updatePassword = async function(plainPassword) {
  const hash = await hashPassword(plainPassword); // DON'T!
  this.password = hash;
};
```

### Why This Design?

1. **Separation of Concerns** - Models = data, Utils = cryptography
2. **Testability** - Test models without password hashing
3. **Flexibility** - Use different algorithms without changing models
4. **Single Responsibility** - Each layer has clear purpose

---

## Media & Uploads

Uploads are stored under `/uploads` and served with security headers.

- Image Processing Pipeline:
  - Use `src/services/image.service.ts` to generate responsive variants.
  - Default variants: 384, 768, 1280 px widths; WebP + JPEG fallback.
  - Controlled via env: `IMAGE_SIZES`, `IMAGE_QUALITY_WEBP`, `IMAGE_QUALITY_JPEG`, `IMAGE_WEBP_ENABLED`.
  - Integrate after saving original file; store returned variant paths in your model if needed.


## Summary

✅ **Authentication:** 4 middleware levels for different security needs  
✅ **Password Hashing:** Argon2id with optimal configuration  
✅ **JWT Tokens:** Stateless access tokens + hashed refresh tokens  
✅ **Rate Limiting:** 5 limiters for different use cases  
✅ **Security:** CORS + security headers (Hono built-in)  
✅ **OAuth:** Google integration with smart linking  
✅ **Services:** 5 services for business logic  
✅ **Architecture:** Clean separation of concerns  

---

*Created: 2025*

