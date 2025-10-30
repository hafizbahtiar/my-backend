# Environment Setup Guide

**Tech Stack:** Bun + Hono + MongoDB (Mongoose)  
**Runtime:** Bun  
**Framework:** Hono  
**Version:** 1.0  
**Created:** 2025

## Overview

Complete guide for setting up environment variables for the template backend.

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Edit `.env` with Your Values

Required variables:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string (min 32 characters)

### 3. Generate JWT Secret

```bash
# Auto-generate and save to .env (recommended)
bun run generate:secret

# For specific environments:
bun run generate:secret:dev    # .env.development
bun run generate:secret:prod   # .env (production)
bun run generate:secret:test   # .env.example

# Or manually with OpenSSL:
openssl rand -base64 32

# Or with Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Required Variables

### 🔴 CRITICAL - Must Set

#### `MONGODB_URI`

**Required:** Yes  
**Format:** MongoDB connection string  
**Example:**
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/template-backend-hono

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# With authentication
MONGODB_URI=mongodb://username:password@host:port/database?options
```

#### `JWT_SECRET`

**Required:** Yes  
**Format:** String (minimum 32 characters)  
**Purpose:** Used to sign and verify JWT tokens  
**Security:** Must be kept secret!

```env
# Generate with OpenSSL
JWT_SECRET=your-generated-secret-key-here-minimum-32-characters
```

**⚠️ IMPORTANT:**
- Never commit this to version control
- Use different values for development and production
- If compromised, regenerate immediately (invalidates all tokens)

## Optional Variables (with Defaults)

### Server Configuration

#### `PORT`
**Default:** `3000`  
**Purpose:** Server listening port  
```env
PORT=3000
```

#### `NODE_ENV`
**Default:** `development`  
**Values:** `development` | `production` | `test`  
**Purpose:** Sets application mode  
```env
NODE_ENV=production
```

### JWT Configuration

#### `ACCESS_TOKEN_EXPIRY`
**Default:** `15m`  
**Format:** Time duration (e.g., `15m`, `1h`, `7d`)  
**Purpose:** How long access tokens are valid  
```env
ACCESS_TOKEN_EXPIRY=15m
```

#### `REFRESH_TOKEN_EXPIRY`
**Default:** `7d`  
**Format:** Time duration  
**Purpose:** How long refresh tokens are valid  
```env
REFRESH_TOKEN_EXPIRY=7d
```

### OAuth Configuration

#### `GOOGLE_CLIENT_ID`
**Default:** Empty (disabled)  
**Purpose:** Google OAuth client ID  
**Get from:** [Google Cloud Console](https://console.cloud.google.com)

```env
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Copy "Web application" client ID

### CORS Configuration

#### `CORS_ORIGIN`
**Default:** `*` (allow all)  
**Purpose:** Control which origins can access API  
**Production:** Set to specific domains  

```env
# Development (allow all)
CORS_ORIGIN=*

# Production (specific domains)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

### Security Configuration

#### `BCRYPT_ROUNDS`
**Default:** `10`  
**Note:** Not used (using Argon2id instead)  
**Purpose:** Kept for backward compatibility  

#### `ARGON2_MEMORY`
**Default:** `65536` (64 MB)  
**Purpose:** Memory cost for password hashing  
**Higher = more secure but slower**

```env
ARGON2_MEMORY=65536
```

#### `ARGON2_TIME`
**Default:** `3`  
**Purpose:** Number of iterations  
**Higher = more secure but slower**

```env
ARGON2_TIME=3
```

#### `ARGON2_PARALLELISM`
**Default:** `4`  
**Purpose:** Number of threads  
**Higher = faster on multi-core systems**

```env
ARGON2_PARALLELISM=4
```

### Redis Configuration
### Image Processing

#### `IMAGE_SIZES`
**Default:** `"384,768,1280"`  
**Purpose:** Comma-separated widths (px) to generate variants

```env
IMAGE_SIZES=384,768,1280
```

#### `IMAGE_QUALITY_WEBP`
**Default:** `82`  
**Purpose:** WebP output quality (1-100)

#### `IMAGE_QUALITY_JPEG`
**Default:** `82`  
**Purpose:** JPEG fallback quality (1-100)

#### `IMAGE_WEBP_ENABLED`
**Default:** `true`  
**Purpose:** Toggle WebP variant generation

### Monitoring Configuration

#### `LOG_LEVEL`
**Default:** `info`  
**Values:** `debug` | `info` | `warn` | `error`  
**Purpose:** Controls verbosity of structured logs

```env
LOG_LEVEL=info
```

#### `SENTRY_DSN`
**Default:** Empty (disabled)  
**Purpose:** Enable error tracking integration (when implemented)

```env
SENTRY_DSN=https://public_key@oXXX.ingest.sentry.io/YYY
```


#### `REDIS_URL`
**Default:** Empty (disabled)  
**Purpose:** Enables Redis-backed rate limiting/cache  
**Examples:**

```env
# Local development
REDIS_URL=redis://localhost:6379

# Production with password
REDIS_URL=redis://:password@your-redis-host:6379
```

## Environment-Specific Configurations

### Development (.env)

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/template-backend-hono-dev
JWT_SECRET=dev-secret-key-at-least-32-characters-long
CORS_ORIGIN=*
GOOGLE_CLIENT_ID=your-dev-google-client-id
```

### Production (.env.production)

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://prod-user:strong-password@cluster.mongodb.net/prod-db
JWT_SECRET=production-secret-generated-with-openssl-at-least-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
GOOGLE_CLIENT_ID=your-prod-google-client-id
ARGON2_MEMORY=65536
ARGON2_TIME=3
```

### Test (.env.test)

```env
NODE_ENV=test
PORT=3001
MONGODB_URI=mongodb://localhost:27017/template-backend-hono-test
JWT_SECRET=test-secret-key-at-least-32-characters
CORS_ORIGIN=*
```

## Security Best Practices

### ✅ DO

1. **Generate strong secrets**
   ```bash
   openssl rand -base64 32
   ```

2. **Use different secrets per environment**
   - Dev: `dev-secret-key-...`
   - Staging: `staging-secret-key-...`
   - Production: Use OpenSSL generated value

3. **Restrict CORS in production**
   ```env
   CORS_ORIGIN=https://yourdomain.com
   ```

4. **Use environment variables in production**
   - Don't use `.env` file in production
   - Set variables in your hosting platform

5. **Rotate secrets regularly**
   - Especially if compromised
   - Plan token invalidation strategy

6. **Keep `.env` in `.gitignore`**
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

### ❌ DON'T

1. **Don't commit `.env` to version control**
   ```bash
   # Check if .env is tracked
   git ls-files | grep .env
   ```

2. **Don't share secrets publicly**
   - Don't paste in chat/slack
   - Don't log secrets in application

3. **Don't use weak secrets**
   ```env
   ❌ JWT_SECRET=secret
   ❌ JWT_SECRET=123456
   ✅ JWT_SECRET=generated-with-openssl-32-chars
   ```

4. **Don't use same secret for dev and prod**

5. **Don't hardcode secrets in code**

## Docker Deployment

For Docker, use environment variables directly:

```dockerfile
# Dockerfile
FROM oven/bun:latest

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
# Don't set sensitive variables in Dockerfile

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

**Run with environment variables:**
```bash
docker run -p 3000:3000 \
  -e MONGODB_URI="..." \
  -e JWT_SECRET="..." \
  your-image
```

**Or use Docker secrets:**
```bash
docker run -p 3000:3000 \
  --secret mongodb_uri \
  --secret jwt_secret \
  your-image
```

## Cloud Platforms

### Vercel

Add environment variables in project settings:
```
MONGODB_URI=...
JWT_SECRET=...
```

### Railway

Add in Railway dashboard → Variables tab

### Render

Add in Render dashboard → Environment variables

### AWS Lambda

Use AWS Systems Manager Parameter Store or Secrets Manager

## Validation

Environment variables are validated on startup. If required variables are missing:

```
Error: Missing required environment variables: MONGODB_URI, JWT_SECRET
Please check your .env file or environment configuration.
```

## Troubleshooting

### "JWT_SECRET too short"

```bash
# Generate 32+ character secret
openssl rand -base64 32
```

### "MongoDB connection failed"

```bash
# Test connection
mongosh "mongodb://localhost:27017/template-backend-hono"

# Check if MongoDB is running
brew services list mongodb  # macOS
systemctl status mongod     # Linux
```

### "Port already in use"

```bash
# Change PORT in .env
PORT=3001
```

### Environment variables not loading

Make sure you:
1. Created `.env` file in project root
2. Installed `dotenv` (usually via Hono/framework)
3. Loaded `.env` before importing config

## Complete Example

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/template-backend-hono

# JWT
JWT_SECRET=aB3xK9mP2sL8qR5tN1vW6zY0uC4dE7hJ0fI
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# OAuth
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com

# CORS
CORS_ORIGIN=*

# Security
ARGON2_MEMORY=65536
ARGON2_TIME=3
ARGON2_PARALLELISM=4
```

## Summary

✅ **Required:** `MONGODB_URI`, `JWT_SECRET`  
✅ **Recommended:** Set `NODE_ENV` and `CORS_ORIGIN` for production  
✅ **Optional:** OAuth, custom token expiries, Argon2 tuning  
✅ **Security:** Generate strong secrets, never commit `.env`  

---

*Reference: `.env.example` in project root*  
*Created: 2025*

