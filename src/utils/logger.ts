/**
 * Logger Utility
 * 
 * Simple logging utility for the application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LOG_LEVELS: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL.toLowerCase()] || LogLevel.INFO;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function writeJson(level: string, message: string, data?: Record<string, unknown> | unknown): void {
  const payload: Record<string, unknown> = {
    ts: formatTimestamp(),
    level: level.toLowerCase(),
    message,
  };

  if (data && typeof data === 'object') {
    Object.assign(payload, data as Record<string, unknown>);
  } else if (data !== undefined) {
    payload.data = data as unknown;
  }

  // One-line JSON for log aggregators
  console.log(JSON.stringify(payload));
}

function shouldLog(level: LogLevel): boolean {
  return level >= CURRENT_LOG_LEVEL;
}

export const logger = {
  debug(message: string, data?: any): void {
    if (shouldLog(LogLevel.DEBUG)) {
      writeJson('debug', message, data);
    }
  },

  info(message: string, data?: any): void {
    if (shouldLog(LogLevel.INFO)) {
      writeJson('info', message, data);
    }
  },

  warn(message: string, data?: any): void {
    if (shouldLog(LogLevel.WARN)) {
      writeJson('warn', message, data);
    }
  },

  error(message: string, error?: Error | any): void {
    if (shouldLog(LogLevel.ERROR)) {
      const errorData = error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;
      writeJson('error', message, errorData);
    }
  },
};

