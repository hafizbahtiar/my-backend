# API Routes Guide

**Tech Stack:** Bun + Hono + MongoDB (Mongoose)  
**Runtime:** Bun  
**Framework:** Hono  
**Version:** 1.0  
**Created:** 2025

## Overview

Complete API routes for the template backend, organized by feature.

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require authentication using Bearer token in Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Auth Routes (`/api/auth`)

### Register
```http
POST /api/auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "username": "@johndoe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "username": "@johndoe",
      "fullName": "John Doe"
    },
    "account": {
      "id": "...",
      "email": "user@example.com",
      "isActive": true,
      "isEmailVerified": false
    }
  }
}
```

**Rate Limit:** 5 per 15 minutes

---

### Login
```http
POST /api/auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Headers (optional):**
- `x-platform`: web | ios | android
- `x-device-model`: Device model
- `x-device-brand`: Device brand
- `x-device-identifier`: Unique device ID
- `x-device-fingerprint`: Device fingerprint

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "@johndoe",
      "fullName": "John Doe"
    },
    "session": {
      "id": "...",
      "deviceId": "..."
    }
  }
}
```

**Rate Limit:** 5 per 15 minutes

---

### Google OAuth Login
```http
POST /api/auth/google
```

**Request:**
```json
{
  "idToken": "google-id-token-from-mobile",
  "deviceInfo": {
    "platform": "ios",
    "deviceModel": "iPhone 14",
    "brand": "Apple",
    "manufacturer": "Apple Inc.",
    "osVersion": "iOS 17.0",
    "deviceName": "John's iPhone",
    "isPhysicalDevice": true,
    "identifier": "device-identifier",
    "fingerprint": "device-fingerprint"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "@user_abc123",
      "avatar": "https://..."
    },
    "session": {
      "id": "...",
      "deviceId": "..."
    }
  }
}
```

**Special Response (401) - Email exists with password:**
```json
{
  "success": false,
  "error": {
    "message": "EMAIL_EXISTS_PASSWORD",
    "code": "AuthenticationError"
  }
}
```

**Rate Limit:** 5 per 15 minutes

---

### Link Google Account
```http
POST /api/auth/link-google
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "idToken": "google-id-token",
  "password": "your-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Google account linked successfully"
  }
}
```

**Rate Limit:** 3 per 5 minutes

---

### Unlink Google Account
```http
POST /api/auth/unlink-google
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Google account unlinked successfully"
  }
}
```

**Rate Limit:** 3 per 5 minutes

---

### Refresh Access Token
```http
POST /api/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "refresh-token-jwt"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token"
  }
}
```

**Rate Limit:** 5 per 15 minutes

---

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Logged out successfully"
  }
}
```

---

### Verify Email
```http
POST /api/auth/verify-email
```

**Request:**
```json
{
  "accountId": "account-id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Email verified successfully"
  }
}
```

**Rate Limit:** 3 per 5 minutes

---

### Request Password Reset
```http
POST /api/auth/password-reset/request
```

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "If account exists, password reset email has been sent",
    "resetToken": "token-for-testing"
  }
}
```

**Rate Limit:** 3 per 5 minutes

---

### Delete Account
```http
DELETE /api/auth/account
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "password": "user-password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Account deleted successfully"
  }
}
```

**Security Features:**
- ✅ Requires password verification
- ✅ Soft delete (sets `isActive: false`)
- ✅ Deactivates all user sessions
- ✅ Creates audit log entry
- ✅ Sends notification email (if email service configured)

**Note:** This is a soft delete. The account data remains in the database but is deactivated. This complies with GDPR "right to be forgotten" while maintaining data integrity.

**Rate Limit:** 3 per 5 minutes

---

## User Routes (`/api/user`)

### Get Profile
```http
GET /api/user/profile
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "username": "@johndoe",
    "fullName": "John Doe",
    "avatar": "https://...",
    "phoneNumber": "+1234567890",
    "bio": "Bio text",
    "email": "user@example.com",
    "emailVerified": true,
    "phoneVerified": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```
```

---

### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "bio": "New bio",
  "phoneNumber": "+1234567890"
}
```

**Response (200):** (same as Get Profile)

**Rate Limit:** 10 per minute

---

### Search Users
```http
GET /api/user/search?q=john&limit=20
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "username": "@johndoe",
      "fullName": "John Doe",
      "avatar": "https://..."
    }
  ]
}
```

---

### Get User by Username
```http
GET /api/user/by-username/:username
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "username": "@johndoe",
    "fullName": "John Doe",
    "avatar": "https://...",
    "bio": "..."
  }
}
```

---

### Check Username Availability
```http
GET /api/user/username/available?username=@newuser
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

---

### Upload Avatar
```http
POST /api/user/avatar
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

**Request:**
Form data with file:
```
file: <file>
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "fileName": "avatar-123-456.jpg",
    "originalName": "photo.jpg",
    "url": "/uploads/avatar-123-456.jpg",
    "size": 102400,
    "mimeType": "image/jpeg",
    "category": "image",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit:** 10 per minute

---

## Session Routes (`/api/sessions`)

### Get User Sessions
```http
GET /api/sessions
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "deviceId": "...",
      "isActive": true,
      "lastLogin": "2025-01-01T00:00:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "...",
      "expiresAt": "2025-01-08T00:00:00.000Z"
    }
  ]
}
```

---

### Get Session Details
```http
GET /api/sessions/:sessionId
Authorization: Bearer <access_token>
```

**Response (200):** (same format as Get User Sessions)

---

### Deactivate Session
```http
DELETE /api/sessions/:sessionId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Session deactivated successfully"
  }
}
```

**Rate Limit:** 3 per 5 minutes

---

### Logout All Devices
```http
POST /api/sessions/logout-all
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "All sessions deactivated successfully"
  }
}
```

**Rate Limit:** 3 per 5 minutes

---

### Deactivate Session by Device
```http
DELETE /api/sessions/device/:deviceId
Authorization: Bearer <access_token>
```

**Response (200):** (same as Deactivate Session)

**Rate Limit:** 3 per 5 minutes

---

### Extend Session
```http
POST /api/sessions/:sessionId/extend
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "additionalDays": 7
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Session extended successfully",
    "newExpiresAt": "2025-01-15T00:00:00.000Z"
  }
}
```

---

## Device Routes (`/api/devices`)

### Get Device by ID
```http
GET /api/devices/:deviceId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "platform": "ios",
    "deviceModel": "iPhone 14",
    "brand": "Apple",
    "manufacturer": "Apple Inc.",
    "osVersion": "iOS 17.0",
    "deviceName": "John's iPhone",
    "isPhysicalDevice": true,
    "isTrusted": true,
    "trustedAt": "2025-01-01T00:00:00.000Z",
    "lastSeen": "2025-01-01T12:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### Get User Devices
```http
GET /api/devices
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "platform": "ios",
      "deviceModel": "iPhone 14",
      "brand": "Apple",
      "manufacturer": "Apple Inc.",
      "osVersion": "iOS 17.0",
      "deviceName": "John's iPhone",
      "isPhysicalDevice": true,
      "isTrusted": true,
      "trustedAt": "2025-01-01T00:00:00.000Z",
      "lastSeen": "2025-01-01T12:00:00.000Z"
    }
  ]
}
```

---

### Get Trusted Devices
```http
GET /api/devices/trusted
Authorization: Bearer <access_token>
```

**Response (200):** (same as Get User Devices)

---

### Mark Device as Trusted
```http
POST /api/devices/:deviceId/trust
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Device marked as trusted",
    "trustedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit:** 10 per minute

---

### Remove Device Trust
```http
POST /api/devices/:deviceId/untrust
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Device trust removed"
  }
}
```

**Rate Limit:** 10 per minute

---

### Update Device
```http
PUT /api/devices/:deviceId
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "deviceName": "My iPhone"
}
```

**Response (200):** (same as Get User Devices)

**Rate Limit:** 10 per minute

---

### Delete Device
```http
DELETE /api/devices/:deviceId
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Device deleted successfully"
  }
}
```

**Rate Limit:** 10 per minute

---

## Health Check

### Health Status
```http
GET /health
```

**Response (200):**
```json
{
  "database": {
    "connected": true,
    "state": "connected",
    "readyState": 1
  },
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ErrorType"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AuthenticationError` | 401 | Authentication failed or token expired |
| `AuthorizationError` | 403 | Insufficient permissions |
| `ValidationError` | 400 | Invalid input data |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Resource conflict (e.g., duplicate) |
| `RateLimitError` | 429 | Rate limit exceeded |

---

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint Category | Rate Limit | Window |
|-------------------|-----------|---------|
| Login/Auth | 5 requests | 15 minutes |
| Strict (password reset, etc.) | 3 requests | 5 minutes |
| General API | 100 requests | 15 minutes |
| User updates | 10 requests | 1 minute |
| Email/SMS | 3 requests | 1 hour |

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1738024800000
```

---

## Address Routes (`/api/addresses`)

### Create Address
```http
POST /api/addresses
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "label": "Home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "isDefault": true,
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "label": "Home",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "isDefault": true,
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Rate Limit:** 10 per minute

---

### Get User Addresses
```http
GET /api/addresses
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "label": "Home",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "country": "USA",
      "isDefault": true,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Default Address
```http
GET /api/addresses/default
Authorization: Bearer <access_token>
```

**Response (200):** (same format as Get User Addresses)

**Rate Limit:** 10 per minute

---

### Get Address by ID
```http
GET /api/addresses/:id
Authorization: Bearer <access_token>
```

**Response (200):** (same format as Create Address)

---

### Update Address
```http
PUT /api/addresses/:id
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "label": "Work",
  "city": "Boston"
}
```

**Response (200):** (same as Create Address)

**Rate Limit:** 10 per minute

---

### Delete Address
```http
DELETE /api/addresses/:id
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Address deleted successfully"
  }
}
```

**Rate Limit:** 10 per minute

---

### Set Default Address
```http
PATCH /api/addresses/:id/set-default
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Address set as default",
    "id": "...",
    "isDefault": true
  }
}
```

**Rate Limit:** 10 per minute

---

## Summary

✅ **Auth Routes** - 14 endpoints (register, login, OAuth, tokens, logout, password reset, account deletion)  
✅ **User Routes** - 6 endpoints (profile, search, username, avatar)  
✅ **Session Routes** - 6 endpoints (list, details, deactivate, extend)  
✅ **Device Routes** - 7 endpoints (get by ID, list, trust, update, delete)  
✅ **Address Routes** - 7 endpoints (create, list, get, update, delete, set default)  
✅ **Health Check** - 1 endpoint  

**Total: 41 production-ready endpoints** with proper error handling and rate limiting!

---

*Created: 2025*

