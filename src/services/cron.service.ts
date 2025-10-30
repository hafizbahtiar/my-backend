import mongoose from 'mongoose';
import CronJob, { ICronJob } from '../models/CronJob';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors';

/**
 * Cron Service
 *
 * Manages dynamic, user-defined cron jobs stored in MongoDB.
 * This service focuses on validation and persistence. Actual execution
 * will be handled by a scheduler/worker (e.g., Agenda) in a follow-up step.
 */

type CreateCronJobInput = {
  name: string;
  type: string; // must be one of allowed job types (enforced by caller or future allowlist)
  cron: string; // standard 5-field or 6-field (with seconds) expression
  timezone?: string; // IANA timezone
  payload?: Record<string, unknown> | null;
  enabled?: boolean;
};

type UpdateCronJobInput = Partial<CreateCronJobInput>;

// Minimal cron expression validation (supports 5 or 6 fields)
function validateCronExpression(expr: string): void {
  if (!expr || typeof expr !== 'string') {
    throw new ValidationError('Cron expression is required');
  }
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5 && parts.length !== 6) {
    throw new ValidationError('Cron expression must have 5 or 6 fields');
  }
}

function validateTimezone(timezone?: string): string {
  const tz = (timezone || 'UTC').trim();
  // Basic sanity check; full validation can be added later with a TZ list
  if (tz.length < 1) throw new ValidationError('Invalid timezone');
  return tz;
}

function toDTO(doc: ICronJob) {
  return {
    id: (doc._id as any).toString(),
    name: doc.name,
    type: doc.type,
    cron: doc.cron,
    timezone: doc.timezone,
    payload: doc.payload ?? null,
    enabled: doc.enabled,
    ownerId: doc.ownerId,
    lastRunAt: doc.lastRunAt ?? null,
    nextRunAt: doc.nextRunAt ?? null,
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function createCronJob(ownerId: string, input: CreateCronJobInput) {
  if (!input.name?.trim()) throw new ValidationError('Name is required');
  if (!input.type?.trim()) throw new ValidationError('Type is required');
  validateCronExpression(input.cron);
  const timezone = validateTimezone(input.timezone);

  // Enforce unique name per owner
  const existing = await CronJob.findOne({ ownerId, name: input.name.trim() });
  if (existing) throw new ConflictError('Job name already exists');

  const job = await CronJob.create({
    name: input.name.trim(),
    type: input.type.trim(),
    cron: input.cron.trim(),
    timezone,
    payload: input.payload ?? null,
    enabled: input.enabled ?? true,
    ownerId,
    status: 'idle',
  });

  return toDTO(job);
}

export async function listCronJobs(ownerId: string, filters?: { enabled?: boolean; type?: string }) {
  const query: any = { ownerId };
  if (typeof filters?.enabled === 'boolean') query.enabled = filters.enabled;
  if (filters?.type) query.type = filters.type;

  const jobs = await CronJob.find(query).sort({ createdAt: -1 });
  return jobs.map(toDTO);
}

export async function getCronJobById(ownerId: string, jobId: string) {
  const job = await CronJob.findOne({ _id: new mongoose.Types.ObjectId(jobId), ownerId });
  if (!job) throw new NotFoundError('Cron job not found');
  return toDTO(job);
}

export async function updateCronJob(ownerId: string, jobId: string, input: CreateCronJobInput) {
  validateCronExpression(input.cron);
  const timezone = validateTimezone(input.timezone);

  const job = await CronJob.findOne({ _id: new mongoose.Types.ObjectId(jobId), ownerId });
  if (!job) throw new NotFoundError('Cron job not found');

  // Check name uniqueness if changed
  const newName = input.name.trim();
  if (newName !== job.name) {
    const exists = await CronJob.findOne({ ownerId, name: newName });
    if (exists) throw new ConflictError('Job name already exists');
    job.name = newName;
  }

  job.type = input.type.trim();
  job.cron = input.cron.trim();
  job.timezone = timezone;
  job.payload = input.payload ?? null;
  job.enabled = input.enabled ?? job.enabled;

  await job.save();
  return toDTO(job);
}

export async function patchCronJob(ownerId: string, jobId: string, input: UpdateCronJobInput) {
  const job = await CronJob.findOne({ _id: new mongoose.Types.ObjectId(jobId), ownerId });
  if (!job) throw new NotFoundError('Cron job not found');

  if (input.name && input.name.trim() !== job.name) {
    const exists = await CronJob.findOne({ ownerId, name: input.name.trim() });
    if (exists) throw new ConflictError('Job name already exists');
    job.name = input.name.trim();
  }
  if (input.type) job.type = input.type.trim();
  if (input.cron) {
    validateCronExpression(input.cron);
    job.cron = input.cron.trim();
  }
  if (input.timezone) job.timezone = validateTimezone(input.timezone);
  if (typeof input.enabled === 'boolean') job.enabled = input.enabled;
  if (input.payload !== undefined) job.payload = input.payload ?? null;

  await job.save();
  return toDTO(job);
}

export async function setCronJobEnabled(ownerId: string, jobId: string, enabled: boolean) {
  const job = await CronJob.findOne({ _id: new mongoose.Types.ObjectId(jobId), ownerId });
  if (!job) throw new NotFoundError('Cron job not found');
  job.enabled = enabled;
  await job.save();
  return toDTO(job);
}

export async function deleteCronJob(ownerId: string, jobId: string) {
  const job = await CronJob.findOne({ _id: new mongoose.Types.ObjectId(jobId), ownerId });
  if (!job) throw new NotFoundError('Cron job not found');
  await CronJob.deleteOne({ _id: job._id });
  return { success: true };
}

// Optional: trigger immediate execution (scheduler will pick this up later)
export async function runCronJobNow(ownerId: string, jobId: string) {
  const job = await CronJob.findOne({ _id: new mongoose.Types.ObjectId(jobId), ownerId });
  if (!job) throw new NotFoundError('Cron job not found');
  // Marker for worker to run immediately (implementation detail handled in scheduler)
  job.nextRunAt = new Date();
  await job.save();
  return toDTO(job);
}


