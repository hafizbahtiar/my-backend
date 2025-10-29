# Authentication Flow Diagrams

**Tech Stack:** Bun + Hono + MongoDB (Mongoose)  
**Created:** 2025

## 1. Registration Flow

```
User → POST /api/auth/register
  ↓
Validate Input (email, password, firstName, lastName, username)
  ↓
Check Email Available?
  ↓ (No) → Return ConflictError
  ↓ (Yes)
Check Username Available?
  ↓ (No) → Return ConflictError
  ↓ (Yes)
Hash Password (Argon2id)
  ↓
Create User Document
  ↓
Create Account Document
  ↓
Return { user, account }
  ✅
```

## 2. Login Flow

```
User → POST /api/auth/login (email + password)
  ↓
Find Account by Email
  ↓ (Not Found) → Return AuthenticationError
  ↓ (Found)
Check isActive? → No → AuthenticationError
  ↓ (Yes)
Check isBanned()? → Yes → AuthenticationError
  ↓ (No)
Check isLocked()? → Yes → AuthenticationError
  ↓ (No)
Check hasPassword()? → No → AuthenticationError
  ↓ (Yes)
Verify Password (Argon2id)
  ↓ (Invalid) → Increment Login Attempts → AuthenticationError
  ↓ (Valid)
Reset Login Attempts
  ↓
Find or Create Device (by identifier)
  ↓
Generate Refresh Token JWT
  ↓
Hash Refresh Token (for database storage)
  ↓
Create Session (with hashed refresh token)
  ↓
Generate Access Token JWT (with sessionId)
  ↓
Return { accessToken, refreshToken, user, session }
  ✅
```

## 3. Google OAuth Login Flow

```
User → POST /api/auth/google (Google ID Token)
  ↓
Verify Google ID Token
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Check if Google already linked?
  ↓ (Yes) → Normal Login Flow (Case A)
  ↓ (No)
Check if email exists in any account?
  ↓ (No) → Create New Account (Case B)
  ↓ (Yes)
Check if account has password?
  ↓ (No) → Auto-link Google → Login (Case C)
  ↓ (Yes) → Return "EMAIL_EXISTS_PASSWORD" Error (Case D)
  ↓
Create Device
  ↓
Create Session
  ↓
Generate Tokens
  ↓
Return { accessToken, refreshToken, user, session }
  ✅

Case A: Google already linked → Normal login
Case B: New user → Create account with Google
Case C: OAuth-only account exists → Auto-link Google
Case D: Password account exists → Requires password verification to link
```

## 4. Password Reset Flow

```
STEP 1: Request Reset
User → POST /api/auth/password-reset/request (email)
  ↓
Find Account by Email
  ↓ (Not Found) → Return success (security: don't reveal)
  ↓ (Found)
Check hasPassword()? → No → Return success
  ↓ (Yes)
Generate Reset Token (32 bytes, secure)
  ↓
Store Token in Account (with 1 hour expiration)
  ↓
Send Password Reset Email (with reset link)
  ↓
Return success
  ✅


STEP 2: Confirm Reset
User → POST /api/auth/password-reset/confirm (resetToken + newPassword)
  ↓
Find Account with matching resetToken (not expired)
  ↓ (Not Found) → AuthenticationError
  ↓ (Found)
Validate New Password (min 8 chars)
  ↓ (Invalid) → ValidationError
  ↓ (Valid)
Hash New Password (Argon2id)
  ↓
Update Password
Clear resetToken
Reset loginAttempts
Unlock account
  ↓
Send Notification Email (password changed)
  ↓
Return success
  ✅
```

## 5. Change Password Flow (Logged-In Users)

```
User → PUT /api/auth/change-password (oldPassword + newPassword)
  ↓
[Auth Middleware] Verify Access Token
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Get UserId from Token
  ↓
Find Account by UserId
  ↓ (Not Found) → NotFoundError
  ↓ (Found)
Check hasPassword()? → No → AuthenticationError
  ↓ (Yes)
Verify Old Password
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Validate New Password (min 8 chars)
  ↓ (Invalid) → ValidationError
  ↓ (Valid)
Hash New Password
  ↓
Update Password (calls account.updatePassword())
Update lastPasswordChange
Reset loginAttempts
Unlock account
  ↓
Send Notification Email (password changed)
  ↓
Return success
  ✅
```

## 6. Email Verification Flow

```
STEP 1: Resend Verification
User → POST /api/auth/resend-verification (email)
  ↓
Find Account by Email
  ↓ (Not Found) → Return success (security)
  ↓ (Found)
Check isEmailVerified? → Yes → Return success
  ↓ (No)
Generate New Verification Token
  ↓
Store in Account (with 24 hour expiration)
  ↓
Send Verification Email
  ↓
Return success
  ✅


STEP 2: Verify Email
User → POST /api/auth/verify-email/confirm (verificationToken)
  ↓
Find Account with matching token (not expired)
  ↓ (Not Found) → AuthenticationError
  ↓ (Found)
Check isEmailVerified? → Yes → Return success
  ↓ (No)
Set isEmailVerified = true
Clear verificationToken
  ↓
Return success
  ✅
```

## 7. Refresh Token Flow

```
User → POST /api/auth/refresh (refreshToken)
  ↓
Verify JWT Signature (verifyRefreshToken)
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Extract Payload (userId, sessionId)
  ↓
Find Session by sessionId
  ↓ (Not Found) → AuthenticationError
  ↓ (Found)
Check isActive? → No → AuthenticationError
  ↓ (Yes)
Check isExpired()? → Yes → AuthenticationError
  ↓ (No)
Verify Token Hash (verifyTokenHash)
  ↓ (Mismatch) → AuthenticationError
  ↓ (Match)
Get Account by userId
  ↓
Check Account Status (active, not banned, not locked)
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Update Session lastLogin
  ↓
Generate New Access Token
  ↓
Return { accessToken }
  ✅
```

## 8. Account Deletion Flow (Soft Delete)

```
User → DELETE /api/auth/account (password)
  ↓
[Auth Middleware] Verify Access Token
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Get UserId from Token
  ↓
Find Account by UserId
  ↓ (Not Found) → NotFoundError
  ↓ (Found)
Verify Password
  ↓ (Invalid) → AuthenticationError
  ↓ (Valid)
Set isActive = false (Soft Delete)
  ↓
Deactivate All User Sessions
  ↓
Create Audit Log Entry
  ↓
Send Notification Email
  ↓
Return success
  ✅
```

**Note:** This is a soft delete. Data remains but is deactivated for GDPR compliance.

## Summary

**Total Auth Endpoints:** 14
- Registration: 1
- Login: 2 (email/password, Google OAuth)
- OAuth Linking: 2 (link, unlink)
- Token: 2 (refresh, logout)
- Password: 3 (reset request, reset confirm, change)
- Email: 3 (verify, resend verification, verify with token)
- Account: 1 (deletion - GDPR compliant)

---

*Created: 2025*

