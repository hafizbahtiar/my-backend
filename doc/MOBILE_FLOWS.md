# Mobile Password Reset & Email Verification Flows

**Tech Stack:** Bun + Hono + MongoDB (Mongoose)  
**Target:** Mobile Apps (Flutter iOS/Android)  
**Created:** 2025

## Mobile-Optimized Password Reset Flow

### Email Content (Mobile-Friendly)

The email now includes:

1. **Clickable Universal Link** - Opens web OR app (deep link)
2. **Copy-Paste Reset Code** - For mobile app users
3. **Web Link** - Fallback for browsers

### Flow Options

#### Option 1: Deep Link (Best UX) 📱

```
User clicks email link
  ↓
Universal link opens mobile app
  ↓
App shows password reset screen
  ↓
User enters new password
  ↓
POST /api/auth/password-reset/confirm
  ↓
Password reset ✅
```

#### Option 2: Manual Code Entry (Reliable) 📋

```
User receives email with code
  ↓
User opens mobile app
  ↓
User goes to "Forgot Password" screen
  ↓
User pastes code from email
  ↓
User enters new password
  ↓
POST /api/auth/password-reset/confirm
  ↓
Password reset ✅
```

#### Option 3: Web Browser (Fallback) 🌐

```
User clicks email link
  ↓
Opens in mobile browser
  ↓
User resets password on web
  ↓
Password reset ✅
```

---

## Email Verification Flow (Mobile-Friendly)

### Flow Options

#### Option 1: Deep Link (Best UX) 📱

```
User receives verification email
  ↓
User clicks link in email
  ↓
Universal link opens mobile app
  ↓
App automatically verifies email
  ↓
POST /api/auth/verify-email/confirm
  ↓
Email verified ✅
```

#### Option 2: Manual Code Entry (Reliable) 📋

```
User receives email with code
  ↓
User opens mobile app
  ↓
User goes to "Verify Email" screen
  ↓
User pastes code from email
  ↓
POST /api/auth/verify-email/confirm
  ↓
Email verified ✅
```

---

## Flutter Implementation

### 1. Setup Deep Links

**Android (`android/app/src/main/AndroidManifest.xml`):**
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="yourdomain.com" android:pathPrefix="/auth" />
  <data android:scheme="yourapp" />
</intent-filter>
```

**iOS (`ios/Runner/Info.plist`):**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
      <string>https</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.yourapp</string>
  </dict>
</array>
```

### 2. Handle Deep Links in Flutter

```dart
import 'package:uni_links/uni_links.dart';

class DeepLinkHandler {
  StreamSubscription? _linkSubscription;

  void init() {
    // Listen for deep links
    getInitialLink().then((initialLink) {
      if (initialLink != null) {
        handleDeepLink(initialLink);
      }
    });

    _linkSubscription = linkStream.listen(
      (String link) => handleDeepLink(link),
      onError: (err) => print('Deep link error: $err'),
    );
  }

  void handleDeepLink(String link) {
    final uri = Uri.parse(link);
    
    if (uri.path.contains('/reset') || uri.path.contains('/auth/reset')) {
      // Password reset
      final token = uri.queryParameters['token'];
      if (token != null) {
        Navigator.pushNamed(context, '/reset-password', arguments: token);
      }
    } else if (uri.path.contains('/verify') || uri.path.contains('/auth/verify')) {
      // Email verification
      final token = uri.queryParameters['token'];
      if (token != null) {
        verifyEmail(token);
      }
    }
  }

  void dispose() {
    _linkSubscription?.cancel();
  }
}
```

### 3. Password Reset Screen (Flutter)

```dart
class PasswordResetScreen extends StatefulWidget {
  final String? token; // From deep link or manual entry

  const PasswordResetScreen({this.token});

  @override
  _PasswordResetScreenState createState() => _PasswordResetScreenState();
}

class _PasswordResetScreenState extends State<PasswordResetScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Pre-fill token if from deep link
    if (widget.token != null) {
      _tokenController.text = widget.token!;
    }
  }

  Future<void> resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/password-reset/confirm'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'resetToken': _tokenController.text,
        'newPassword': _passwordController.text,
      }),
    );

    if (response.statusCode == 200) {
      showSuccessDialog('Password reset successful!');
      Navigator.pushReplacementNamed(context, '/login');
    } else {
      showErrorDialog('Invalid or expired reset token');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Reset Password')),
      body: Form(
        key: _formKey,
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            children: [
              TextField(
                controller: _tokenController,
                decoration: InputDecoration(
                  labelText: 'Reset Code',
                  hintText: 'Paste code from email',
                ),
              ),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  hintText: 'At least 8 characters',
                ),
                validator: (value) {
                  if (value == null || value.length < 8) {
                    return 'Password must be at least 8 characters';
                  }
                  return null;
                },
              ),
              ElevatedButton(
                onPressed: resetPassword,
                child: Text('Reset Password'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 4. Email Verification Screen

```dart
class EmailVerificationScreen extends StatefulWidget {
  final String? token; // From deep link or manual entry

  const EmailVerificationScreen({this.token});

  @override
  _EmailVerificationScreenState createState() => _EmailVerificationScreenState();
}

class _EmailVerificationScreenState extends State<EmailVerificationScreen> {
  @override
  void initState() {
    super.initState();
    // Auto-verify if token from deep link
    if (widget.token != null) {
      verifyEmail(widget.token!);
    }
  }

  Future<void> verifyEmail(String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/verify-email/confirm'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'verificationToken': token}),
    );

    if (response.statusCode == 200) {
      showSuccessDialog('Email verified successfully!');
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      showErrorDialog('Invalid or expired verification token');
    }
  }

  // ... UI code for manual entry
}
```

---

## Email Template Preview

### Password Reset Email

```
┌─────────────────────────────────────┐
│   🔐 Password Reset Request         │
├─────────────────────────────────────┤
│                                     │
│ You requested to reset your         │
│ password.                           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    Reset Password Now         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ⚠️  Using Mobile App?              │
│                                     │
│  Copy the reset code and paste it  │
│  in the app:                        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Reset Code:                   │ │
│  │ xK9mP2sL8qR5tN1vW6zY0uC4dE7hJ│ │
│  └───────────────────────────────┘ │
│                                     │
│  ⏰ Expires in 1 hour               │
│                                     │
└─────────────────────────────────────┘
```

### Email Verification Email

```
┌─────────────────────────────────────┐
│   ✅ Verify Your Email              │
├─────────────────────────────────────┤
│                                     │
│ Thank you for signing up!           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │    Verify Email Now           │ │
│  └───────────────────────────────┘ │
│                                     │
│  📱 Using Mobile App?               │
│                                     │
│  Copy the verification code:        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Verification Code:            │ │
│  │ mP2sL8qR5tN1vW6zY0uC4dE7hJ0fI│ │
│  └───────────────────────────────┘ │
│                                     │
│  ⏰ Expires in 24 hours             │
│                                     │
└─────────────────────────────────────┘
```

---

## Mobile UX Best Practices

### ✅ DO

1. **Auto-fill token from deep link**
   - Best UX - user just clicks email link

2. **Show copy button for token**
   - Makes it easy to copy from email

3. **Clear instructions**
   - Tell user where to paste code

4. **Support both flows**
   - Deep link OR manual entry

5. **Show expiry time**
   - "Expires in 1 hour"

### ❌ DON'T

1. **Don't rely only on deep links**
   - Some email clients don't handle them well

2. **Don't hide the token**
   - Make it easy to copy

3. **Don't force web browser**
   - Provide app-native flow

---

## Summary

### Mobile-Optimized Features

✅ **3 reset options** - Deep link, copy code, web link  
✅ **Copy-paste friendly** - Tokens displayed in email  
✅ **Universal links** - Works for web and mobile  
✅ **Clear instructions** - Mobile-specific guidance  
✅ **Fallback support** - Works even if deep links fail  

Your backend now fully supports mobile apps! 🎉

---

*Created: 2025*

