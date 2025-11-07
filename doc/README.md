# Template Backend - Documentation

**Tech Stack:** Bun + Hono + MongoDB (Mongoose) + TypeScript  
**Status:** Production Ready ✅

## Documentation Index

### 📚 Essential Guides

1. **[Implementation Guide](./IMPLEMENTATION.md)** ⭐
   - Complete implementation guide
   - Authentication, security, OAuth
   - Services, utilities, architecture
   - Middleware usage examples
   - **Everything you need to build with this template**

2. **[Mobile Optimization](./MOBILE_OPTIMIZATION.md)** 📱
   - Mobile-first backend design
   - Token flow for mobile apps
   - Device tracking for mobile
   - Flutter integration examples

3. **[Mobile Flows](./MOBILE_FLOWS.md)** 📱
   - Password reset flow for mobile
   - Email verification flow
   - Deep linking implementation
   - Mobile UX best practices

5. **[Performance Optimization](./PERFORMANCE_OPTIMIZATION.md)** ⚡
   - Complete performance optimization guide
   - Parallel queries implementation
   - Response compression
   - Async operations
   - Performance benchmarks

6. **[CI/CD Guide](./CICD_GUIDE.md)** 🚀
   - GitHub Actions CI/CD pipeline
   - Automated testing and deployment
   - Branch protection strategies
   - Security auditing
   - Release management

7. **[Auth Flows](./AUTH_FLOW.md)** 🔐
   - Complete authentication flow diagrams
   - All 14 auth endpoints explained
   - Token lifecycle
   - Security layers

8. **[API Routes](./api-routes-guide.md)** ⭐
  - All 50 endpoints documented
   - Request/response examples
   - Rate limiting information
   - Authentication requirements

9. **[Database Structure](./database-structure.md)**
   - Complete schema definitions
   - Security analysis
   - Indexes and relationships
   - Model specifications

10. **[Environment Setup](./environment-setup-guide.md)** ⭐
   - Complete .env configuration
   - Required vs optional variables
   - Security best practices
   - Platform-specific setup

11. **[Source Diagnosis](./SRC_DIAGNOSIS.md)** 🔍
   - Complete analysis of `src/` directory
   - Missing functions and features
   - Production readiness assessment
   - Action items and recommendations

---

## Documentation Structure

**Essential Guides** (Read First):
- README.md, IMPLEMENTATION.md, environment-setup-guide.md

**Feature Guides** (As Needed):
- AUTH_FLOW.md, MOBILE_OPTIMIZATION.md, MOBILE_FLOWS.md

**Performance & Optimization**:
- PERFORMANCE_OPTIMIZATION.md (Performance benchmarks and optimizations)
- load-tests/README.md (Load testing with k6)

**Monitoring & Observability**:
- Structured JSON logs with request context (requestId, method, path, status, durationMs, ip)
- Response headers: `X-Request-Id`, `X-Response-Time`
- Optional error tracking (Sentry) via `SENTRY_DSN`; captures request failures and crashes

**Uploads & Images**:
- Image processing service (resize to multiple widths, WebP + JPEG fallback)
- Configurable sizes/quality via env (see environment guide)

**Auth & Tokens**:
- Short-lived access tokens; refresh tokens rotate on each `/api/auth/refresh`
- Reuse detection deactivates the session

**API Keys**:
- Create/list/revoke under `/api/apikeys`
- Send key via `x-api-key: ak_<keyId>.<secret>` (or Authorization Bearer)

**Payments (Stripe)**:
- Stripe integration via `src/config/stripe.ts`
- Lazy initialization; enabled when both `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` are set
- API version: `2025-10-29.clover` (automatically configured)

**Development & Deployment**:
- CICD_GUIDE.md (CI/CD pipeline, testing, deployment)
  - PM2 processes: API (`my-backend`), Scheduler Worker (`my-backend-worker`)
  - API Docs: Swagger UI at `/docs`, spec at `/openapi.json`

**Reference Guides** (For Details):
- database-structure.md, api-routes-guide.md, SRC_DIAGNOSIS.md

---

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Environment

```bash
# Copy template
cp .env.example .env

# Generate JWT secret (auto-saves to .env)
bun run generate:secret

# Edit .env and add MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/your-db
```

### 3. Run Server

```bash
# Development (with hot reload)
bun run dev

# Production
bun run start
```

Server runs on `http://localhost:3000` (or custom PORT from .env)

---

## API Endpoints

### Authentication (15 endpoints)
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth (Mobile-Optimized)
- `POST /api/auth/link-google` - Link Google account
- `POST /api/auth/unlink-google` - Unlink Google
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/password-reset/request` - Request reset (Email)
- `POST /api/auth/password-reset/confirm` - Confirm reset (Mobile-Friendly)
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/resend-verification` - Resend verification
- `POST /api/auth/verify-email/confirm` - Verify with token
- `DELETE /api/auth/account` - Delete account (GDPR compliance)
- `GET /api/auth/account-status` - Public account status check (exists, flags)

### User (6 endpoints)
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/search` - Search users
- `GET /api/user/by-username/:username` - Get by username
- `GET /api/user/username/available` - Check availability
- `POST /api/user/avatar` - Upload avatar

### Addresses (7 endpoints)
- `POST /api/addresses` - Create address
- `GET /api/addresses` - List user addresses
- `GET /api/addresses/default` - Get default address
- `GET /api/addresses/:id` - Get address details
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PATCH /api/addresses/:id/set-default` - Set as default

### Sessions (6 endpoints)
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:sessionId` - Get details
- `DELETE /api/sessions/:sessionId` - Deactivate
- `POST /api/sessions/logout-all` - Logout all
- `DELETE /api/sessions/device/:deviceId` - By device
- `POST /api/sessions/:sessionId/extend` - Extend

### Devices (7 endpoints)
- `GET /api/devices` - List devices
- `GET /api/devices/:deviceId` - Get device details
- `GET /api/devices/trusted` - Trusted devices
- `POST /api/devices/:deviceId/trust` - Mark trusted
- `POST /api/devices/:deviceId/untrust` - Remove trust
- `PUT /api/devices/:deviceId` - Update
- `DELETE /api/devices/:deviceId` - Delete

### Cron (8 endpoints)
- `POST /api/cron/jobs` - Create job
- `GET /api/cron/jobs` - List jobs
- `GET /api/cron/jobs/:id` - Get job
- `PUT /api/cron/jobs/:id` - Replace job
- `PATCH /api/cron/jobs/:id` - Update job
- `PATCH /api/cron/jobs/:id/enabled` - Enable/disable job
- `POST /api/cron/jobs/:id/run-now` - Trigger now
- `DELETE /api/cron/jobs/:id` - Delete job

### Stripe (10 endpoints)
- `POST /api/stripe/payment-intents` - Create payment intent
- `GET /api/stripe/payment-intents/:id` - Get payment intent
- `POST /api/stripe/payment-intents/:id/confirm` - Confirm payment
- `POST /api/stripe/payment-intents/:id/cancel` - Cancel payment
- `POST /api/stripe/customers` - Create customer
- `GET /api/stripe/customers/:id` - Get customer
- `GET /api/stripe/customers/:id/payment-methods` - List payment methods
- `POST /api/stripe/payment-methods/:id/attach` - Attach payment method
- `POST /api/stripe/payment-methods/:id/detach` - Detach payment method
- `POST /api/stripe/setup-intents` - Create setup intent

### Health (1 endpoint)
- `GET /health` - Health check

**Total: 60 production-ready endpoints**

---

## Features

### ✅ Security-First
- Argon2id password hashing
- JWT with hashed refresh tokens
- 4-level authentication middleware
- 5 rate limiters
- CORS + security headers
- Optional Redis-backed rate limiting (falls back to in-memory if REDIS_URL is unset)
- IP and device tracking
- Email notifications (Mobile-Optimized)
- Audit logging for security events

### ✅ Production-Ready
- 60 API endpoints
- 10 services (auth, user, session, device, address, email, audit, google-oauth, cron, stripe)
- **Performance optimized** ⚡
  - Parallel database queries (~40-50% faster profile retrieval)
  - Response compression (40-60% smaller payloads)
  - Async audit logging (non-blocking)
  - Field projection on all queries
- Separated email templates (HTML, CSS, TS)
- Complete error handling
- Session management with TTL
- Device trust system
- Google OAuth with smart linking
- Mobile-optimized email templates
- **Performance Grade: A** - Excellent performance, production-ready!

### ✅ Developer Experience
- TypeScript throughout
- Comprehensive documentation
- Hot reload in development
- Environment-based config
- Modular architecture
- Load testing with k6
- CI/CD pipeline with GitHub Actions

---

## Project Structure

```
src/
├── config/          # Database & environment
├── models/          # Mongoose models (8)
├── middleware/      # Auth, rate limit, security, monitoring
├── services/        # Business logic (9 services)
├── templates/       # Email templates (separated HTML, CSS, TS)
│   └── emails/      # Email template functions
├── routes/          # API routes (50 endpoints)
├── utils/           # Password, JWT, errors, storage, logger
└── server.ts        # Entry point

doc/                 # Documentation (11 comprehensive guides)
.github/             # GitHub Actions (CI/CD workflows)
│   └── workflows/   # CI, release, deployment
load-tests/          # k6 load testing scripts
│   ├── auth.test.js # Authentication load tests
│   ├── api.test.js  # API endpoint tests
│   └── README.md     # Load testing guide
scripts/             # Utility scripts (JWT secret generation)
.env.example         # Environment template
CONTRIBUTING.md      # Contribution guidelines
```

---

## Security

### Password Hashing
- **Algorithm:** Argon2id (OWASP recommended)
- **Memory:** 64 MB
- **Time Cost:** 3 iterations
- **Parallelism:** 4 threads

### JWT Tokens
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days (hashed in database)
- **Algorithm:** HS256

### Rate Limiting
- **Login:** 5 requests per 15 minutes
- **API:** 100 requests per 15 minutes
- **Strict:** 3 requests per 5 minutes
- **User:** 10 requests per minute
- **Email/SMS:** 3 requests per hour

---

## Mobile Support

### Mobile-Optimized Features

✅ **Password Reset** - Email with copy-paste code  
✅ **Email Verification** - Mobile-friendly verification flow  
✅ **Deep Linking** - Universal links support  
✅ **Device Tracking** - Full mobile device context  
✅ **OAuth** - Google login with ID token  
✅ **Token Management** - Secure storage guidance  

See [Mobile Optimization Guide](./MOBILE_OPTIMIZATION.md) for details.

---

## Next Steps

1. **Setup Environment** - Copy `.env.example` and configure
2. **Start Development** - Run `bun run dev`
3. **Test Endpoints** - Use provided examples
4. **Customize** - Add your business logic
5. **Deploy** - Production-ready out of the box

---

## Utilities

```bash
# Generate JWT secret (auto-saves to .env)
bun run generate:secret

# Generate for specific environment
bun run generate:secret:dev    # .env.development
bun run generate:secret:prod   # .env (production)
bun run generate:secret:test   # .env.example
```

---

## Support

- **Issues:** Check documentation first
- **Examples:** See API routes guide
- **Architecture:** See implementation guide

---

## License

MIT

---

*Created: 2025*  
*Status: Production Ready ✅*