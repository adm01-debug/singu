/**
 * Production-safe logger.
 * - Development: full console output for debugging
 * - Production: structured JSON for error/warn (for error tracking integration)
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface StructuredLog {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

function structuredLog(level: LogLevel, args: unknown[]): void {
  const message = typeof args[0] === 'string' ? args[0] : String(args[0]);
  const entry: StructuredLog = {
    level,
    message,
    timestamp: new Date().toISOString(),
    data: args.length > 1 ? args.slice(1) : undefined,
  };

  // In production, only output warn/error as structured JSON
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  }
}

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : (...args: unknown[]) => structuredLog('warn', args),
  error: isDev ? console.error.bind(console) : (...args: unknown[]) => structuredLog('error', args),
  info: isDev ? console.info.bind(console) : () => {},
  debug: isDev ? console.debug.bind(console) : () => {},
  table: isDev ? console.table.bind(console) : () => {},
  group: isDev ? console.group.bind(console) : () => {},
  groupEnd: isDev ? console.groupEnd.bind(console) : () => {},
};
