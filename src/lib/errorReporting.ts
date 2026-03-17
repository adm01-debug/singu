/**
 * Sistema de Monitoramento de Erros em Produção
 * Captura, agrega e reporta erros para análise
 */

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
    url: window.location.origin + window.location.pathname, // Exclude query params that may contain tokens
    userAgent: navigator.userAgent,
    userId: sessionStorage.getItem('singu_user_context') ?? undefined,
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
    // Em produção, enviar para edge function ou serviço externo
    if (import.meta.env.PROD) {
      // Exemplo: enviar para endpoint de logging
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(batch),
      // });
      
      // Por enquanto, salvar no localStorage para debug
      try {
        let existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        existingLogs.push(...batch.errors);

        // Manter apenas os últimos 50 erros
        if (existingLogs.length > 50) {
          existingLogs = existingLogs.slice(-50);
        }

        localStorage.setItem('error_logs', JSON.stringify(existingLogs));
      } catch (storageError) {
        console.warn('Failed to persist error logs to localStorage:', storageError);
      }
    }
    
    // Log no console em dev
    if (import.meta.env.DEV) {
      console.group('🐛 Error Report Batch');
      batch.errors.forEach(err => {
        console.error(`[${err.severity.toUpperCase()}] ${err.message}`, err);
      });
      console.groupEnd();
    }
  } catch (e) {
    // Silenciar erros do próprio sistema de logging
    console.warn('Failed to flush error buffer:', e);
  }
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
      sessionStorage.setItem('singu_user_context', userId);
    },
  };
}

// Recupera logs de erro salvos (para debug)
export function getErrorLogs(): ErrorReport[] {
  try {
    return JSON.parse(localStorage.getItem('error_logs') || '[]');
  } catch {
    return [];
  }
}

// Limpa logs de erro
export function clearErrorLogs(): void {
  localStorage.removeItem('error_logs');
}

export type { ErrorReport, ErrorBatch };
