/**
 * Sistema de Monitoramento de Erros em Produção
 * Captura, agrega e reporta erros para análise
 */
import { logger } from '@/lib/logger';

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
}

interface ErrorBatch {
  errors: ErrorReport[];
  sessionId: string;
  appVersion: string;
}

// Armazena erros em memória para batch reporting
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 segundos

// Session ID único para correlação
const sessionId = crypto.randomUUID();

// Fingerprint para agrupar erros similares
function generateFingerprint(error: Error): string {
  const stack = error.stack || '';
  const firstStackLine = stack.split('\n')[1] || '';
  return btoa(`${error.name}:${error.message}:${firstStackLine}`).slice(0, 32);
}

// Determina severidade baseada no tipo de erro
function determineSeverity(error: Error): ErrorReport['severity'] {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'medium';
  }
  if (message.includes('chunk') || message.includes('loading')) {
    return 'low';
  }
  if (message.includes('auth') || message.includes('permission')) {
    return 'high';
  }
  if (message.includes('undefined') || message.includes('null')) {
    return 'medium';
  }
  
  return 'medium';
}

// Cria relatório de erro
function createErrorReport(
  error: Error,
  componentStack?: string,
  metadata?: Record<string, unknown>
): ErrorReport {
  return {
    id: crypto.randomUUID(),
    message: error.message,
    stack: error.stack,
    componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId: localStorage.getItem('userId') ?? undefined,
    metadata,
    severity: determineSeverity(error),
    fingerprint: generateFingerprint(error),
  };
}

// Envia batch de erros para o servidor
async function flushErrorBuffer(): Promise<void> {
  if (errorBuffer.length === 0) return;
  
  const batch: ErrorBatch = {
    errors: [...errorBuffer],
    sessionId,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  };
  
  // Limpa buffer antes de enviar
  errorBuffer.length = 0;
  
  try {
    // ─── PROD: try real telemetry destinations ───
    if (import.meta.env.PROD) {
      const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

      // Option 1: Sentry envelope API (preferred — fully featured)
      if (sentryDsn) {
        try {
          await sendToSentry(sentryDsn, batch);
        } catch (sentryErr) {
          // Sentry failed — fall through to edge function backup
          if (import.meta.env.DEV) console.warn('Sentry send failed:', sentryErr);
        }
      }
      // Option 2: Self-hosted edge function (backup / GDPR-friendly)
      else if (supabaseUrl) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/error-reporter`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batch),
            keepalive: true, // survives page unload
          });
        } catch {
          // Both destinations failed — drop silently to avoid recursive error loop
        }
      }
      // Note: we do NOT persist errors in localStorage anymore.
      // localStorage was orphaning errors with no way to retrieve them
      // and leaking error data across users on shared devices.
    }

    // ─── DEV: pretty console group ───
    if (import.meta.env.DEV) {
      logger.group('🐛 Error Report Batch');
      batch.errors.forEach(err => {
        logger.error(`[${err.severity.toUpperCase()}] ${err.message}`, err);
      });
      logger.groupEnd();
    }
  } catch {
    // Silenciar erros do próprio sistema de logging — noop em produção
  }
}

/**
 * Send batch to Sentry via envelope API (no SDK required, ~0 KB overhead).
 * Parses DSN, builds envelope, posts to /api/{project}/envelope/.
 */
async function sendToSentry(dsn: string, batch: ErrorBatch): Promise<void> {
  // Parse DSN: https://PUBLIC_KEY@HOST/PROJECT_ID
  const m = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!m) throw new Error('Invalid SENTRY_DSN format');
  const [, publicKey, host, projectId] = m;

  const auth = [
    'Sentry sentry_version=7',
    `sentry_client=singu-crm/${batch.appVersion}`,
    `sentry_key=${publicKey}`,
  ].join(', ');

  // Build envelope: {header}\n{event header}\n{event payload}\n... (one per error)
  const envelope = batch.errors.map(err => {
    const event = {
      event_id: err.id.replace(/-/g, ''),
      timestamp: new Date(err.timestamp).getTime() / 1000,
      platform: 'javascript',
      level: err.severity === 'critical' ? 'fatal' : err.severity === 'high' ? 'error' : 'warning',
      logger: 'singu-crm',
      release: batch.appVersion,
      environment: import.meta.env.MODE,
      message: { formatted: err.message },
      exception: err.stack ? {
        values: [{
          type: 'Error',
          value: err.message,
          stacktrace: { frames: err.stack.split('\n').slice(1).map(line => ({ filename: line.trim() })) },
        }],
      } : undefined,
      tags: {
        severity: err.severity,
        fingerprint: err.fingerprint,
        session_id: batch.sessionId,
      },
      user: err.userId ? { id: err.userId } : undefined,
      request: { url: err.url, headers: { 'User-Agent': err.userAgent } },
      extra: err.metadata,
    };
    const eventHeader = JSON.stringify({ type: 'event', content_type: 'application/json' });
    return `${eventHeader}\n${JSON.stringify(event)}`;
  }).join('\n');

  const envHeader = JSON.stringify({ event_id: batch.errors[0].id.replace(/-/g, '') });
  const body = `${envHeader}\n${envelope}\n`;

  await fetch(`https://${host}/api/${projectId}/envelope/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': auth,
    },
    body,
    keepalive: true,
  });
}

// Captura erro e adiciona ao buffer
export function captureError(
  error: Error,
  componentStack?: string,
  metadata?: Record<string, unknown>
): void {
  const report = createErrorReport(error, componentStack, metadata);
  
  // Deduplica por fingerprint (não reportar mesmo erro múltiplas vezes)
  const isDuplicate = errorBuffer.some(e => e.fingerprint === report.fingerprint);
  if (!isDuplicate) {
    errorBuffer.push(report);
  }
  
  // Flush imediato para erros críticos
  if (report.severity === 'critical') {
    flushErrorBuffer();
  } else if (errorBuffer.length >= MAX_BUFFER_SIZE) {
    flushErrorBuffer();
  }
}

// Captura exceções não tratadas
export function initGlobalErrorHandlers(): void {
  // Erros JavaScript não capturados
  window.addEventListener('error', (event) => {
    captureError(
      event.error || new Error(event.message),
      undefined,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });
  
  // Promise rejections não tratadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    captureError(error, undefined, { type: 'unhandledrejection' });
  });
  
  // Flush periódico
  setInterval(flushErrorBuffer, FLUSH_INTERVAL);
  
  // Flush ao sair da página
  window.addEventListener('beforeunload', () => {
    flushErrorBuffer();
  });
  
  // Flush ao visibility change (mobile)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushErrorBuffer();
    }
  });
}

// Hook para componentes React
export function useErrorReporter() {
  return {
    captureError,
    captureMessage: (message: string, severity: ErrorReport['severity'] = 'low') => {
      captureError(new Error(message), undefined, { customMessage: true, severity });
    },
    setUserContext: (userId: string) => {
      localStorage.setItem('userId', userId);
    },
  };
}

// Recupera logs de erro salvos (para debug)
export function getErrorLogs(): ErrorReport[] {
  try {
    return []; // localStorage error storage removed in audit 2026-04-09
  } catch {
    return [];
  }
}

// Limpa logs de erro
export function clearErrorLogs(): void {
  // localStorage error storage removed in audit 2026-04-09 — noop
}

export type { ErrorReport, ErrorBatch };
