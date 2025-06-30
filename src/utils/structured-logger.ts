/**
 * Structured JSON logging for Cloudflare Workers
 * Optimized for Workers Logs observability platform
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: number;
  readonly environment: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ProductionLogger {
  readonly info: (message: string, metadata?: Record<string, unknown>) => void;
  readonly warn: (message: string, metadata?: Record<string, unknown>) => void;
  readonly error: (message: string, metadata?: Record<string, unknown>) => void;
  readonly debug: (message: string, metadata?: Record<string, unknown>) => void;
}

const SENSITIVE_KEYS = [
  'discordToken',
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'authorization',
] as const;

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...metadata };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      delete sanitized[key];
    }
  }

  return sanitized;
}

export function createProductionLogger(environment: string): ProductionLogger {
  function log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      environment,
      ...(metadata !== undefined && { metadata: sanitizeMetadata(metadata) }),
    };

    let logMethod: typeof console.log;
    if (level === 'error') {
      logMethod = console.error;
    } else if (level === 'warn') {
      logMethod = console.warn;
    } else {
      logMethod = console.log;
    }

    logMethod(JSON.stringify(entry));
  }

  return {
    info: (message: string, metadata?: Record<string, unknown>): void => {
      log('info', message, metadata);
    },
    warn: (message: string, metadata?: Record<string, unknown>): void => {
      log('warn', message, metadata);
    },
    error: (message: string, metadata?: Record<string, unknown>): void => {
      log('error', message, metadata);
    },
    debug: (message: string, metadata?: Record<string, unknown>): void => {
      log('debug', message, metadata);
    },
  };
}
