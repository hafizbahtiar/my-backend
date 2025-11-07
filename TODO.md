# TODO / Roadmap

## Must Haves (near term)
- Implement phone verification (OTP): model fields, service, routes, templates
- Write integration tests for auth, sessions, cron, devices
- Add request validation layer (Zod) on all routes

## Nice to Haves (short term)
- Caching layer (Redis) for user profile and frequent reads
- Document upload service and routes (beyond avatar)
- Push notifications support (store device push tokens, send service)
- Expand OpenAPI coverage (all routes) with Zod schemas

## Performance
- CDN integration for static/uploads
- Query performance review and additional indexes where needed

## Security
- IP allowlist for admin routes
- Add APM and slow-query logging

## DevEx
- Lint/pre-commit hooks, consistent formatting
- Seed scripts and sample data for local dev
- Load testing scenarios expansion

## Documentation
- Add worker setup guide for Agenda (scheduler)
- Add Postman collection / OpenAPI spec export

## Completed (recent)
- Dynamic Cron: model, service, routes
- Account Status Check: service and route
- Redis-backed rate limiting (code): enable with REDIS_URL and `bun add redis`
- Scheduler worker (Agenda) and PM2 entry: `my-backend-worker`
- Structured JSON logging with request context (requestId, durationMs)
- Response headers: X-Request-Id and X-Response-Time
- Refresh token rotation (rotate on /api/auth/refresh, reuse detection)
- Swagger UI & OpenAPI endpoints (`/docs`, `/openapi.json`)
- API key auth for external integrations (create/list/revoke, x-api-key header)
- Error tracking integration (Sentry) via `@sentry/bun` and `SENTRY_DSN`
- Image processing pipeline (resize, WebP) via sharp; env-configurable
- Stripe integration: config, service, routes (10 endpoints), models (StripeCustomer, Payment)
