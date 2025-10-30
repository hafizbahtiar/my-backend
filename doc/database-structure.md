# Database Structure Documentation

**Tech Stack:** Bun + Hono + MongoDB (Mongoose)  
**Database:** MongoDB with Mongoose ODM  
**Version:** 1.0  
**Created:** 2025

## Overview

This document defines the database schema for a production-ready backend template using:
- **Runtime:** Bun
- **Framework:** Hono
- **Database:** MongoDB
- **ODM:** Mongoose

---

## Security Vulnerability Analysis

### Critical Vulnerabilities

1. **Sessions.accessToken** - ⚠️ **CRITICAL**
   - **Issue**: Storing access tokens in database is a security anti-pattern
   - **Severity**: High
   - **Risk**: Access tokens should be stateless (JWT). If compromised, tokens can be extracted directly from DB
   - **Solution**: Remove `accessToken` field from Sessions. Access tokens should be JWT that are validated without DB lookup

2. **Sessions.refreshToken** - ⚠️ **HIGH**
   - **Issue**: Storing refresh token without encryption/hashing
   - **Severity**: High
   - **Risk**: If database is breached, attackers can steal refresh tokens for account takeover
   - **Solution**: Hash refresh tokens using Argon2id or bcrypt before storing

3. **Missing session expiration** - ⚠️ **HIGH**
   - **Issue**: No TTL (Time To Live) or automatic cleanup mechanism
   - **Severity**: High
   - **Risk**: Orphaned sessions, infinite attack surface, storage bloat
   - **Solution**: Add `expiresAt` field and implement TTL index in MongoDB

### Medium Vulnerabilities

4. **Missing IP tracking** - ⚠️ **MEDIUM**
   - **Issue**: No IP address or user agent stored in Sessions
   - **Severity**: Medium
   - **Risk**: Cannot detect suspicious login patterns, account takeover attempts
   - **Solution**: Add `ipAddress`, `userAgent`, `location` fields

5. **Missing rate limiting fields** - ⚠️ **MEDIUM**
   - **Issue**: No fields to track and prevent brute force attacks
   - **Severity**: Medium
   - **Risk**: Account takeover through brute force password attempts
   - **Solution**: Add `loginAttempts`, `lastAttemptAt`, `lockUntil` fields to Accounts

6. **Device trust management** - ⚠️ **MEDIUM**
   - **Issue**: No way to mark trusted devices or detect new device logins
   - **Severity**: Medium
   - **Solution**: Add `isTrusted`, `trustedAt`, `verifiedAt` fields to Devices

7. **Audit trail missing** - ⚠️ **MEDIUM**
   - **Issue**: No audit logs for security events
   - **Severity**: Medium
   - **Risk**: Cannot investigate security incidents
   - **Solution**: Create separate SecurityEvents collection (out of scope for base structure)

### Low/Informational

8. **Missing indexes** - ⚠️ **PERFORMANCE**
   - **Issue**: No explicit indexes mentioned
   - **Severity**: Low (performance, not security)
   - **Solution**: Add compound indexes for frequently queried fields

9. **Missing timestamps** - ⚠️ **TRACEABILITY**
   - **Issue**: No `createdAt`, `updatedAt` fields
   - **Severity**: Low
   - **Solution**: Add automatic timestamps

10. **Username uniqueness** - ⚠️ **INFORMATIONAL**
    - **Note**: Ensure unique index on username field
    - **Solution**: Add unique index

11. **Sessions.deviceId relationship** - ⚠️ **INFORMATIONAL**
    - **Note**: Ensure foreign key constraint or reference
    - **Solution**: Use Mongoose ref to Devices collection

12. **Accounts.ban structure** - ⚠️ **VALIDATION**
    - **Note**: Ensure proper validation for ban dates
    - **Solution**: Add validation rules

---

## Revised Database Schema

### 1. Accounts Collection

```typescript
{
  userId: ObjectId,              // One-to-one with Users
  email: string,                 // Unique, indexed
  password?: string,             // Argon2id hash (optional for OAuth-only users)
  isActive: boolean,             // Default: true
  isEmailVerified: boolean,      // Default: false
  isPhoneVerified: boolean,      // Default: false
  ban: {
    type: 'temporary' | 'permanent' | null,
    startAt: Date,
    endAt: Date,
    reason: string
  },
  // Security fields
  loginAttempts: number,         // Default: 0
  lastAttemptAt: Date,
  lockUntil: Date,              // Optional: for temporary lockout
  // OAuth providers
  providers: [{
    provider: 'google' | 'github' | 'apple',
    providerId: string,          // User ID from OAuth provider
    providerEmail: string,       // Email from OAuth provider
    accessToken?: string,        // Encrypted, optional
    refreshToken?: string,       // Encrypted, optional
    expiresAt?: Date,
    linkedAt: Date,
    lastLogin?: Date
  }],
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastPasswordChange?: Date
}
```

**Indexes:**
- `userId`: Unique, 1
- `email`: Unique, 1
- `isActive`: 1
- `providers.providerId`: 1 (for OAuth lookup)

---

### 2. Users Collection

```typescript
{
  firstName: string,
  lastName: string,
  fullName: string,             // Computed: firstName + lastName
  username: string,             // @username, unique, lowercase, regex: ^@[a-z0-9_.-]{3,}$
  avatar: string,               // Optional: URL to avatar image
  phoneNumber: string,          // Optional
  bio: string,                  // Optional
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `username`: Unique, 1
- `fullName`: Text index (for search)

---

### 3. Sessions Collection

```typescript
{
  userId: ObjectId,             // Many-to-one with Users (indexed)
  deviceId: ObjectId,           // One-to-one with Devices (indexed)
  refreshToken: string,         // Hashed (Argon2id/bcrypt)
  isActive: boolean,            // Default: true
  lastLogin: Date,              // Auto-updated on refresh
  // Security tracking
  ipAddress: string,
  userAgent: string,
  location: {                   // Optional: from IP geolocation
    country: string,
    city: string,
    coordinates: [number, number]
  },
  // Expiration
  expiresAt: Date,              // Auto-set based on refresh token expiration
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: 1
- `deviceId`: Unique, 1
- `refreshToken`: Unique, 1 (hashed version)
- `expiresAt`: 1 (TTL index for auto-deletion)
- Compound: `{ userId: 1, isActive: 1 }`

**TTL Index:** `{ "expiresAt": 1 }, { expireAfterSeconds: 0 }`

⚠️ **Important:** 
- DO NOT store access tokens here
- Hash refresh tokens before storing
- Use TTL index to auto-delete expired sessions

---

### 4. Devices Collection

```typescript
{
  platform: 'ios' | 'android' | 'web' | 'desktop' | 'tablet' | 'other',
  deviceModel: string,          // e.g., "iPhone 13 Pro"
  brand: string,                // e.g., "Apple"
  manufacturer: string,         // e.g., "Apple Inc."
  osVersion: string,            // e.g., "iOS 17.0"
  deviceName: string,           // e.g., "John's iPhone"
  isPhysicalDevice: boolean,
  // Performance specs
  ramTotalMB: number,           // Optional
  ramAvailableMB: number,       // Optional
  diskTotalBytes: number,       // Optional
  diskFreeBytes: number,        // Optional
  // Identification
  identifier: string,           // Unique device identifier (fingerprint)
  fingerprint: string,          // Browser/device fingerprint
  extra: {
    [key: string]: any          // Flexible field for additional data
  },
  // Trust & security
  isTrusted: boolean,           // Default: false
  trustedAt: Date,             // When device was marked trusted
  verifiedAt: Date,            // When device was verified via email/SMS
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastSeen: Date               // Last time device was used
}
```

**Indexes:**
- `identifier`: Unique, 1
- `fingerprint`: 1
- `userId`: 1 (if you add this field for direct queries)
- Compound: `{ identifier: 1, userId: 1 }`

---

### 5. Addresses Collection

```typescript
{
  userId: ObjectId,             // Many-to-one with Users (indexed)
  label: string,                // e.g., "Home", "Work", "Shipping Address"
  street: string,
  city: string,
  state: string,
  postalCode: string,
  country: string,
  isDefault: boolean,           // Default: false
  // Optional fields
  coordinates: {                // For map integration
    latitude: number,
    longitude: number
  },
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId`: 1
- `isDefault`: 1
- Compound: `{ userId: 1, isDefault: 1 }`

---

### 6. Cron Jobs Collection

```typescript
{
  name: string,              // Unique per owner
  type: string,              // Allowed job type key
  cron: string,              // 5/6-field cron expression
  timezone: string,          // IANA timezone, default: UTC
  payload?: object | null,   // Type-specific params
  enabled: boolean,          // Default: true
  ownerId: string,           // Owner user id
  lastRunAt?: Date | null,
  nextRunAt?: Date | null,
  status: 'idle' | 'running' | 'failed' | 'paused',
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- Unique compound: `{ ownerId: 1, name: 1 }`
- `{ enabled: 1, nextRunAt: 1 }`
- `{ status: 1 }`, `{ type: 1 }`

---

## Security Best Practices

### 1. Password Storage
- Use **Argon2id** with parameters:
  - memoryCost: 65536 (64 MB)
  - timeCost: 3
  - parallelism: 4

### 2. Refresh Token Storage
- Hash before storing using Argon2id or bcrypt
- Generate cryptographically random tokens (32+ bytes)
- Set expiration: 7-30 days

### 3. Session Management
- Never store access tokens
- Use stateless JWT for access tokens
- Implement refresh token rotation
- Add TTL index for automatic cleanup

### 4. Rate Limiting
- Implement in middleware (not in DB structure)
- Use Redis or in-memory store
- Limit: 5 login attempts per 15 minutes per IP

### 5. Indexes
- Create indexes on all foreign keys
- Create unique indexes on identifiers
- Use TTL indexes for temporary data
- Monitor index usage and optimize

### 6. Data Validation
- Validate all inputs at application level
- Use Mongoose schemas with strict validation
- Sanitize user input
- Validate email format, phone format

### 7. Audit Logging (Recommended)
Create a separate `SecurityEvents` collection for:
- Login attempts
- Password changes
- Email verification
- Device verification
- Ban/unban actions
- Suspicious activity

---

## Implementation Notes

### Mongoose Schemas Location
Create schemas in: `src/models/`

### Recommended Structure
```
src/
  models/
    Account.ts
    User.ts
    Session.ts
    Device.ts
    Address.ts
```

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/your-db
JWT_SECRET=your-secret-key-min-32-chars
REFRESH_TOKEN_EXPIRY=7d
ACCESS_TOKEN_EXPIRY=15m
```

### Migration Strategy
- Use migrations for schema changes in production
- Consider using `mongodb-migrate` or custom migration scripts

---

## Security Checklist

- [x] All passwords hashed with Argon2id ✅ (`src/utils/password.ts`)
- [x] Refresh tokens hashed before storage ✅ (`src/utils/password.ts`)
- [x] Access tokens are JWT (not stored) ✅ (`src/utils/jwt.ts`)
- [x] TTL index on sessions collection ✅ (Session model)
- [x] Unique indexes on email, username, identifiers ✅ (All models)
- [ ] Rate limiting middleware implemented
- [ ] IP address tracking in sessions
- [ ] Device fingerprinting implemented
- [ ] Audit logging for security events
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (Mongoose does this by default)
- [ ] CORS properly configured
- [ ] HTTPS enforced in production

---

## Performance Optimization

### Recommended Indexes Summary
```javascript
// Accounts
db.accounts.createIndex({ email: 1 }, { unique: true })
db.accounts.createIndex({ userId: 1 }, { unique: true })
db.accounts.createIndex({ isActive: 1 })

// Users
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ fullName: "text gi" }) // Full-text search

// Sessions
db.sessions.createIndex({ userId: 1 })
db.sessions.createIndex({ deviceId: 1 }, { unique: true })
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.sessions.createIndex({ userId: 1, isActive: 1 })

// Devices
db.devices.createIndex({ identifier: 1 }, { unique: true })
db.devices.createIndex({ fingerprint: 1 })

// Addresses
db.addresses.createIndex({ userId: 1 })
db.addresses.createIndex({ userId: 1, isDefault: 1 })
```

---

## Future Considerations

1. **Multi-tenancy**: Add `tenantId` if needed
2. **Soft deletes**: Add `deletedAt` field for soft delete pattern
3. **Audit fields**: Add `createdBy`, `updatedBy` if multi-admin support
4. **Time zones**: Store dates in UTC, convert in application
5. **Database replication**: Plan for read replicas for scalability
6. **Caching strategy**: Redis for session data, rate limiting
7. **Analytics**: Separate collection for analytics events
8. **Backup strategy**: Automated daily backups, point-in-time recovery

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- [Argon2 Specification](https://github.com/P-H-C/phc-winner-argon2)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

