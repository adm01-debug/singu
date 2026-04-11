/**
 * Logger centralizado — suprime output em produção.
 * Em dev: logs estruturados com timestamp e requestId.
 * Em prod: silencioso (zero console output).
 */

const isDev = import.meta.env.DEV;

let _requestId: string | null = null;

/** Set a correlation ID for the current request/operation flow */
export function setRequestId(id: string) {
  _requestId = id;
}

/** Generate a short unique request ID */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatArgs(level: string, args: unknown[]): unknown[] {
  if (!isDev) return args;
  const meta: Record<string, string> = {
    ts: new Date().toISOString(),
    level,
  };
  if (_requestId) meta.rid = _requestId;
  return [`[${meta.ts}] [${level.toUpperCase()}]${_requestId ? ` [${_requestId}]` : ''}`, ...args];
}

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) console.error(...formatArgs('error', args));
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...formatArgs('warn', args));
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...formatArgs('info', args));
  },
  log: (...args: unknown[]) => {
    if (isDev) console.log(...formatArgs('log', args));
  },
  group: (label: string) => {
    if (isDev) console.group(label);
  },
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  /** Structured log entry as JSON (useful for debugging complex flows) */
  structured: (event: string, data?: Record<string, unknown>) => {
    if (isDev) {
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        event,
        rid: _requestId,
        ...data,
      }));
    }
  },
} as const;
