# Mobile Backend Optimization Guide

**Tech Stack:** Bun + Hono + MongoDB (Mongoose)  
**Target:** Mobile Apps (Flutter iOS/Android)  
**Created:** 2025

## Current Status

✅ **Already Mobile-Friendly:**
- Google OAuth with ID token verification (mobile-first)
- Device tracking with comprehensive device info
- Token-based authentication (JWT)
- Session management with TTL
- Device trust system

⚠️ **Needs Mobile Optimization:**
- Token storage guidance
- Push notification support
- Deep linking for OAuth
- Biometric authentication hints
- Mobile-specific error handling

---

## Token Flow for Mobile

### Mobile Token Storage (Flutter)

```
Backend returns:
{
  accessToken: "eyJ...",
  refreshToken: "eyJ...",
  user: {...},
  session: {...}
}

Flutter stores:
- accessToken → Secure Storage (Keychain/Keystore)
- refreshToken → Secure Storage
- user → Local Database (SQLite/Hive)
- session → Local Database

HTTP Request Header:
Authorization: Bearer <accessToken>
```

### Token Refresh Strategy

```
Mobile App makes API call
  ↓
Access Token in header
  ↓
401 Unauthorized? → Token expired
  ↓
Yes → Call POST /api/auth/refresh
  ↓
Retry original request with new token
  ↓
Return to user
```

**Implementation in Flutter:**
```dart
class ApiClient {
  String? accessToken;
  String? refreshToken;

  Future<Response> get(String path) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: {'Authorization': 'Bearer $accessToken'},
    );

    // Auto-refresh on 401
    if (response.statusCode == 401) {
      await refreshAccessToken();
      // Retry original request
      return http.get(
        Uri.parse('$baseUrl$path'),
        headers: {'Authorization': 'Bearer $accessToken'},
      );
    }

    return response;
  }

  Future<void> refreshAccessToken() async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/refresh'),
      body: jsonEncode({'refreshToken': refreshToken}),
    );

    final data = jsonDecode(response.body);
    accessToken = data['data']['accessToken'];
  }
}
```

---

## Push Notification Support

### Add to Device Model

```typescript
// In Device model, add:
interface IDevice {
  // ... existing fields
  pushNotificationToken?: string;  // FCM/APNs token
  pushNotificationEnabled?: boolean;
  lastNotificationAt?: Date;
}
```

### Push Notification Service (Optional)

```typescript
// src/services/push.service.ts
export async function sendPushNotification(
  deviceId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const device = await Device.findById(deviceId);
  if (!device || !device.pushNotificationToken) {
    return;
  }

  // Send via FCM or APNs
  // Implementation depends on your push provider
}
```

### Endpoints for Mobile

```
POST /api/devices/:deviceId/push-token
Body: { pushToken: "fcm-token-here" }

Response: { success: true }

DELETE /api/devices/:deviceId/push-token
Response: { success: true }
```

---

## Deep Linking for OAuth

### Mobile Deep Link Handling

When user clicks OAuth link:
```
1. User clicks "Login with Google"
2. Redirect to: https://accounts.google.com/oauth
3. User authenticates
4. Redirect back to: yourapp://auth/google?token=...
5. App receives deep link
6. Extract token
7. Call POST /api/auth/google with idToken
```

### Backend OAuth Response

```typescript
// Already implemented ✅
// POST /api/auth/google returns:
{
  success: true,
  data: {
    accessToken: "...",
    refreshToken: "...",
    user: {...},
    session: {...}
  }
}
```

---

## Mobile-Optimized Features

### 1. Device Information

**Current Implementation:** ✅ Good

Headers from Mobile:
```
x-platform: ios | android
x-device-model: iPhone 14 Pro Max
x-device-brand: Apple
x-manufacturer: Apple Inc.
x-os-version: iOS 17.0
x-device-name: John's iPhone
x-is-physical-device: true
x-device-identifier: unique-device-id
x-device-fingerprint: device-fingerprint-hash
```

**Recommendation:** Add more mobile-specific fields

### 2. Biometric Authentication Support

Add endpoint for biometric hint:
```
POST /api/auth/biometric-hint
Body: { deviceId: "...", biometricType: "face" | "fingerprint" | "none" }

Response: { biometricEnabled: true }
```

### 3. Offline-First Support

**Current:** Backend is stateless (good for mobile)

**Mobile App Strategy:**
- Cache access token locally
- Cache user data locally
- Queue offline actions
- Sync when online

---

## Mobile-Specific Security

### Current: ✅ Already Mobile-Secure

1. **Tokens stored hashed in database** ✅
2. **Short-lived access tokens (15 min)** ✅
3. **Device tracking** ✅
4. **Session management with TTL** ✅
5. **Account lockout** ✅

### Additional Mobile Security

```typescript
// Rate limiting per device (already implemented)
- Login: 5 attempts per 15 minutes per device
- API: 100 requests per 15 minutes

// Device trust (already implemented)
- Mark trusted devices
- Untrusted devices require extra verification
```

---

## Mobile API Response Format

### Current Format (Mobile-Friendly) ✅

```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "email": "...",
      "firstName": "...",
      "lastName": "...",
      "username": "...",
      "avatar": "..."
    },
    "session": {
      "id": "...",
      "deviceId": "..."
    }
  }
}
```

### Error Format (Already Good) ✅

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ErrorType"
  }
}
```

---

## Mobile Optimization Checklist

### ✅ Already Implemented

- [x] Token-based authentication (JWT)
- [x] Refresh token flow
- [x] Device tracking with detailed info
- [x] Google OAuth with ID token
- [x] Session management with TTL
- [x] Device trust system
- [x] Rate limiting per device
- [x] JSON responses
- [x] Error handling with codes
- [x] Account lockout
- [x] Password reset flow

### 🚀 Recommended Additions (Optional)

- [ ] Push notification tokens in Device model
- [ ] Biometric authentication hints
- [ ] App version tracking
- [ ] Install ID tracking
- [ ] App-specific rate limits
- [ ] Battery-aware optimizations

---

## Flutter Integration Example

### 1. Login with Google

```dart
Future<void> loginWithGoogle() async {
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  
  // 1. Get Google ID token
  final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
  final GoogleSignInAuthentication googleAuth = 
      await googleUser!.authentication;
  final String idToken = googleAuth.idToken!;

  // 2. Send to backend
  final response = await http.post(
    Uri.parse('$baseUrl/api/auth/google'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'idToken': idToken,
      'deviceInfo': await getDeviceInfo(),
    }),
  );

  // 3. Save tokens
  final data = jsonDecode(response.body);
  await saveTokens(
    data['data']['accessToken'],
    data['data']['refreshToken'],
  );
}

Future<Map<String, dynamic>> getDeviceInfo() async {
  final deviceInfo = await DeviceInfoPlugin().deviceInfo;
  
  if (deviceInfo is AndroidDeviceInfo) {
    return {
      'platform': 'android',
      'deviceModel': deviceInfo.model,
      'brand': deviceInfo.brand,
      'manufacturer': deviceInfo.manufacturer,
      'osVersion': 'Android ${deviceInfo.version.release}',
      'deviceName': await getDeviceName(),
      'isPhysicalDevice': deviceInfo.isPhysicalDevice,
      'identifier': deviceInfo.id,
      'fingerprint': deviceInfo.fingerprint,
    };
  } else if (deviceInfo is IosDeviceInfo) {
    return {
      'platform': 'ios',
      'deviceModel': deviceInfo.model,
      'brand': 'Apple',
      'manufacturer': 'Apple Inc.',
      'osVersion': 'iOS ${deviceInfo.systemVersion}',
      'deviceName': deviceInfo.name,
      'isPhysicalDevice': !deviceInfo.isSimulator,
      'identifier': deviceInfo.identifierForVendor!,
      'fingerprint': deviceInfo.identifierForVendor!,
    };
  }
  
  return {};
}
```

### 2. Secure Token Storage

```dart
// Using flutter_secure_storage
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
  ),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
);

// Save tokens
await storage.write(key: 'access_token', value: accessToken);
await storage.write(key: 'refresh_token', value: refreshToken);

// Get tokens
final accessToken = await storage.read(key: 'access_token');
final refreshToken = await storage.read(key: 'refresh_token');

// Delete tokens on logout
await storage.delete(key: 'access_token');
await storage.delete(key: 'refresh_token');
```

---

## Mobile vs Web Differences

| Feature | Web | Mobile |
|---------|-----|--------|
| Token Storage | Cookie/HttpOnly | Secure Storage |
| Automatic Refresh | Browser manages | App manages |
| Session | Cookie-based | Token-based |
| OAuth | Redirect flow | Deep link flow |
| Device Info | Limited headers | Full device context |
| Push Notifications | Web push | Native push |

**Current Backend:** ✅ Works for both!

---

## Summary

### ✅ Your Backend is Mobile-Ready!

**Strengths:**
1. Token-based auth (perfect for mobile)
2. Device tracking (mobile-specific)
3. Google OAuth with ID token (mobile-first)
4. Stateless design (works offline-first)
5. Rate limiting per device
6. Session management with TTL
7. Clean JSON responses

**Optional Enhancements:**
1. Push notification support
2. Biometric hints
3. App version tracking
4. Deep link handling (client-side)

**No changes needed** - your backend is production-ready for mobile apps! 🎉

---

*Created: 2025*

