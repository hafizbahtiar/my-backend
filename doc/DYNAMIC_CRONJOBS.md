## Dynamic Cronjobs (Design + API)

This document describes how to add user-driven, runtime-configurable cronjobs to this Bun + Hono + Mongo backend. The design is safe (no arbitrary code), persistent (Mongo-backed), and production-ready.

### High-level overview
- Users create/update/delete scheduled jobs from a mobile client.
- API validates input and stores jobs in MongoDB.
- A worker (Agenda) reads jobs from Mongo and runs predefined handlers on schedule.
- Jobs survive restarts, can be paused/resumed, and are observable via logs.

### Why Agenda
- Stores state in MongoDB (already in the stack)
- Supports cron expressions, intervals, timezones, unique jobs
- Reliable restarts and backoff, job locking

### Architecture
1) API service (existing Hono app)
   - Endpoints to manage jobs
   - AuthN/AuthZ to restrict who can create/modify jobs
2) Scheduler worker
   - Initializes Agenda with the same Mongo connection
   - Registers allowed job types and their handlers
   - Syncs DB changes → active Agenda schedules

### Allowed job types (examples)
- sendEmail: { to, subject, template, params }
- purgeSessions: { inactiveDays }
- generateReport: { type, period }

Add more by defining a handler and white-listing the type.

### Data model (Mongo)
Collection: `cron_jobs`

Fields:
- _id: ObjectId
- name: string (user-friendly name, unique per owner)
- type: string (must be one of allowed types)
- cron: string (cron expression, e.g., "0 8 * * *")
- timezone: string (IANA TZ, default: UTC)
- payload: object (validated per type)
- enabled: boolean (default true)
- ownerId: string (who created it)
- lastRunAt: Date | null
- nextRunAt: Date | null
- status: 'idle' | 'running' | 'failed' | 'paused'
- createdAt: Date
- updatedAt: Date

Indexes:
- { ownerId: 1, name: 1 } unique
- { enabled: 1, nextRunAt: 1 }

### Validation
- `type` must be in allowed list
- `cron` validated using cron-parser
- `timezone` validated against IANA TZ database
- `payload` validated per type schema (Zod or similar)

### API (proposed)

Base path: `/api/cron`

- POST `/api/cron/jobs`
  - Create a job
  - Body: { name, type, cron, timezone?, payload?, enabled? }
  - Returns created job

- GET `/api/cron/jobs`
  - List jobs for current user (supports filters: enabled, type)

- GET `/api/cron/jobs/:id`
  - Get one job (must belong to user or admin)

- PUT `/api/cron/jobs/:id`
  - Replace a job (re-validate, re-register)

- PATCH `/api/cron/jobs/:id`
  - Partial update (e.g., { enabled: false })

- DELETE `/api/cron/jobs/:id`
  - Delete a job (unschedule + remove)

- POST `/api/cron/jobs/:id/run-now`
  - Trigger a job immediately (optional)

AuthN/AuthZ: Require access token; restrict operations to owner or admin.

### Worker (Agenda) lifecycle
File: `src/jobs/scheduler.ts`

1) Initialize Agenda:
   - `new Agenda({ mongo: mongoose.connection.db, db: { collection: 'agendaJobs' } })`
2) Define handlers for allowed types:
   - `agenda.define('sendEmail', async (job) => { /* ... */ })`
3) On boot:
   - Query `cron_jobs` where `enabled: true`
   - For each, `agenda.create(type, payload).repeatEvery(cron, { timezone })` + `unique({ 'data.jobId': _id })`
   - Save jobs; keep map of jobId → agenda job
4) Watch changes:
   - On API create/update/delete, call scheduler to (re)schedule or cancel
   - Optionally, use Mongo change streams for automatic sync
5) Observability:
   - Log start/end, duration, errors; update `lastRunAt`, `nextRunAt`, `status`

### Security
- No arbitrary code from clients
- Only allow predefined `type`s; validate `payload` per type
- Rate limit management endpoints
- Enforce role checks

### Timezones
- Store and honor IANA timezone on schedule
- Document that cron executes in that timezone

### Idempotency & retries
- Use Agenda’s job locking to prevent overlaps
- For handlers, implement idempotent operations (e.g., keys or dedupe tokens)
- Configure backoff for retries if needed

### Deployment
- Add a PM2 app for the scheduler worker (separate from API) or keep in same process initially

Example PM2 entry (worker):
```js
// ecosystem.config.js
{
  name: 'my-backend-worker',
  cwd: '/var/www/my-backend',
  script: 'src/jobs/scheduler.ts',
  interpreter: '/home/hafiz/.bun/bin/bun',
}
```

### Scheduler Worker
- Location: `src/jobs/scheduler.ts`
- Uses the existing Mongoose connection and Agenda to run jobs
- Schedules all enabled `CronJob` docs on boot (cron + timezone)
- Handlers registry in-file (extend with your own types):
  - `cleanupOldAuditLogs` (example)
  - `sendEmail` (placeholder)

### Start/Manage (PM2)
```bash
pm2 start ecosystem.config.js           # starts API + worker
pm2 restart my-backend-worker          # restart only worker
pm2 logs my-backend-worker             # tail worker logs
```

### Local development
1) `bun add agenda cron-parser zod`
2) Implement `src/models/CronJob.ts` (Mongoose schema)
3) Implement `src/jobs/scheduler.ts`
4) Implement routes under `src/routes/cron.routes.ts`
5) Mount at `/api/cron` in `src/routes/index.ts`
6) Run API and worker (same process first; split later if needed)

### Open questions / options
- Do we split the worker into its own PM2 process now or later?
- Which initial job types should be enabled?
- Do we need per-tenant scoping?

### Next steps (implementation plan)
1) Create `CronJob` model with validation utilities
2) Add `cron.routes.ts` with full CRUD + run-now
3) Add `jobs/scheduler.ts` with Agenda initialization and handlers
4) Wire scheduler boot in `src/server.ts` (optional) or separate process
5) Add logs/metrics and error reporting around job execution

Once this is merged, we can scaffold the code.


