import * as Sentry from '@sentry/bun';

let isEnabled = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN || '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.0, // tracing off by default
    integrations: [],
  });
  isEnabled = true;
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!isEnabled) return;
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v as any));
    }
    if (err instanceof Error) {
      Sentry.captureException(err);
    } else {
      Sentry.captureMessage(typeof err === 'string' ? err : 'Unknown error');
    }
  });
}

export function flushSentry(timeoutMs: number = 2000) {
  if (!isEnabled) return Promise.resolve();
  return Sentry.flush(timeoutMs);
}


