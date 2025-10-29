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

function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
  }
  
  return `${prefix} ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  return level >= CURRENT_LOG_LEVEL;
}

export const logger = {
  debug(message: string, data?: any): void {
    if (shouldLog(LogLevel.DEBUG)) {
      console.log(formatMessage('debug', message, data));
    }
  },

  info(message: string, data?: any): void {
    if (shouldLog(LogLevel.INFO)) {
      console.log(formatMessage('info', message, data));
    }
  },

  warn(message: string, data?: any): void {
    if (shouldLog(LogLevel.WARN)) {
      console.warn(formatMessage('warn', message, data));
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
      console.error(formatMessage('error', message, errorData));
    }
  },
};

