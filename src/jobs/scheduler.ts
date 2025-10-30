import mongoose from 'mongoose';
import Agenda, { Job } from 'agenda';
import connectDB from '../config/database';
import CronJob, { ICronJob } from '../models/CronJob';
import { cleanupOldAuditLogs } from '../services/audit.service';

// Allowed/known job type registry
type JobHandler = (job: Job) => Promise<void>;

const jobHandlers: Record<string, JobHandler> = {
  // Example maintenance job
  cleanupOldAuditLogs: async (job: Job) => {
    const days = job.attrs.data?.daysToKeep ?? 90;
    await cleanupOldAuditLogs(days);
  },

  // Placeholder: extend with your own handlers
  sendEmail: async (job: Job) => {
    const payload = job.attrs.data;
    // Integrate with your email service here if needed
    console.log('sendEmail job executed', payload);
  },
};

async function defineHandlers(agenda: Agenda) {
  Object.entries(jobHandlers).forEach(([name, handler]) => {
    agenda.define(name, async (job: Job) => handler(job));
  });
}

async function scheduleFromDatabase(agenda: Agenda) {
  const jobs: ICronJob[] = await CronJob.find({ enabled: true }).exec();

  for (const job of jobs) {
    const handlerName = job.type;
    if (!jobHandlers[handlerName]) {
      console.warn(`Unknown job type: ${handlerName} for job ${job.name}`);
      continue;
    }

    // Unique by job id to avoid duplicates
    const jobId = job._id.toString();
    const unique = { 'data.jobId': jobId } as Record<string, unknown>;

    // Create a job with payload + metadata
    const agendaJob = agenda.create(handlerName, { ...(job.payload || {}), jobId });
    agendaJob.unique(unique);

    // Use cron expression, honor timezone
    agendaJob.repeatEvery(job.cron, { timezone: job.timezone });
    await agendaJob.save();
  }
}

async function boot() {
  await connectDB();

  // Use existing mongoose connection for Agenda
  const agenda = new Agenda({
    // Use existing native db handle from Mongoose
    mongo: mongoose.connection.db as any,
    processEvery: '30 seconds',
    defaultConcurrency: 5,
  });

  await defineHandlers(agenda);
  await agenda.start();
  await scheduleFromDatabase(agenda);

  console.log('📅 Scheduler started with Agenda');

  const graceful = async () => {
    console.log('🛑 Shutting down scheduler...');
    await agenda.stop();
    await mongoose.connection.close();
    process.exit(0);
  };

  process.on('SIGINT', graceful);
  process.on('SIGTERM', graceful);
}

boot().catch((err) => {
  console.error('Scheduler failed to start:', err);
  process.exit(1);
});


