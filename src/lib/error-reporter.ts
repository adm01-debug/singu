/**
 * Lightweight error reporting service.
 * In production, errors are captured and can be forwarded to external services
 * like Sentry, Bugsnag, or a custom endpoint.
 *
 * Usage:
 *   import { errorReporter } from '@/lib/error-reporter';
 *   errorReporter.captureError(error, { context: 'useContacts' });
 */

interface ErrorContext {
  /** Where the error occurred (component, hook, function name) */
  context?: string;
  /** Additional metadata */
  tags?: Record<string, string>;
  /** User-related info (never PII - just IDs) */
  userId?: string;
  /** Severity level */
  level?: 'error' | 'warning' | 'info';
}

interface BreadcrumbEntry {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

const MAX_BREADCRUMBS = 30;
const MAX_ERROR_QUEUE = 50;

class ErrorReporter {
  private breadcrumbs: BreadcrumbEntry[] = [];
  private errorQueue: Array<{ error: unknown; context: ErrorContext; timestamp: number }> = [];
  private initialized = false;
  private endpoint: string | null = null;

  /**
   * Initialize the error reporter with optional external endpoint.
   * Call once during app bootstrap.
   */
  init(config?: { endpoint?: string }) {
    if (this.initialized) return;
    this.endpoint = config?.endpoint ?? null;
    this.initialized = true;

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error ?? event.message, {
        context: 'window.onerror',
        tags: { filename: event.filename ?? 'unknown', lineno: String(event.lineno ?? 0) },
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        context: 'unhandledrejection',
        level: 'error',
      });
    });
  }

  /**
   * Add a breadcrumb to help trace what happened before an error.
   */
  addBreadcrumb(category: string, message: string, level: BreadcrumbEntry['level'] = 'info') {
    this.breadcrumbs.push({
      timestamp: Date.now(),
      category,
      message,
      level,
    });

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs = this.breadcrumbs.slice(-MAX_BREADCRUMBS);
    }
  }

  /**
   * Capture an error with optional context.
   */
  captureError(error: unknown, context: ErrorContext = {}) {
    const entry = {
      error,
      context: { level: 'error' as const, ...context },
      timestamp: Date.now(),
    };

    // Always log in development
    if (import.meta.env.DEV) {
      console.error(`[ErrorReporter] ${context.context ?? 'unknown'}:`, error);
    }

    // Queue for reporting
    this.errorQueue.push(entry);
    if (this.errorQueue.length > MAX_ERROR_QUEUE) {
      this.errorQueue = this.errorQueue.slice(-MAX_ERROR_QUEUE);
    }

    // Send to external service if configured
    this.flush();
  }

  /**
   * Capture a warning (non-critical issue).
   */
  captureWarning(message: string, context: ErrorContext = {}) {
    this.captureError(new Error(message), { ...context, level: 'warning' });
  }

  /**
   * Set user context for error reports.
   */
  setUser(userId: string | null) {
    if (userId) {
      this.addBreadcrumb('auth', `User identified: ${userId.slice(0, 8)}...`);
    }
  }

  /**
   * Get recent errors (useful for diagnostics).
   */
  getRecentErrors() {
    return [...this.errorQueue];
  }

  /**
   * Get breadcrumbs (useful for diagnostics).
   */
  getBreadcrumbs() {
    return [...this.breadcrumbs];
  }

  /**
   * Flush error queue to external endpoint.
   * Override this method to integrate with Sentry, Bugsnag, etc.
   */
  private async flush() {
    if (!this.endpoint || this.errorQueue.length === 0) return;

    const errors = this.errorQueue.splice(0, 10);

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: errors.map(e => ({
            message: e.error instanceof Error ? e.error.message : String(e.error),
            stack: e.error instanceof Error ? e.error.stack : undefined,
            context: e.context,
            timestamp: e.timestamp,
            breadcrumbs: this.breadcrumbs.slice(-10),
            url: window.location.href,
            userAgent: navigator.userAgent,
          })),
        }),
        keepalive: true,
      });
    } catch {
      // Re-queue on failure (without infinite loop)
      this.errorQueue.unshift(...errors);
    }
  }
}

export const errorReporter = new ErrorReporter();
