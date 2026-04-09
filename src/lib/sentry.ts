// ============================================================================
// SINGU CRM — Setup Sentry para observabilidade frontend
//
// Path: src/lib/sentry.ts
//
// Setup completo do Sentry para capturar erros, performance, e replays
// de sessão. Habilita-se via .env.
// ============================================================================

import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log("[sentry] VITE_SENTRY_DSN not set, skipping init");
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || "unknown",

    // Performance monitoring (10% sample em prod, 100% em dev)
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session replay (1% das sessões em prod, 100% das que tiverem erro)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
        // Mascara campos sensíveis
        mask: ['input[type="password"]', 'input[name*="cpf"]', 'input[name*="cnpj"]'],
      }),
    ],

    // Ignora erros conhecidos e sem ação
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      // Random network errors
      "Network request failed",
      "NetworkError",
      "Failed to fetch",
      // ResizeObserver loops (cosmético)
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Service Worker
      "Non-Error promise rejection captured",
    ],

    // Filtra dados sensíveis antes de enviar
    beforeSend(event, hint) {
      // Não envia em dev a menos que VITE_SENTRY_FORCE_SEND seja true
      if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_FORCE_SEND) {
        console.log("[sentry] Would send:", event);
        return null;
      }

      // Remove tokens de Authorization headers
      if (event.request?.headers?.Authorization) {
        event.request.headers.Authorization = "[REDACTED]";
      }

      // Remove possíveis tokens de URLs
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /(token|access_token|api_key)=[^&]+/gi,
          "$1=[REDACTED]"
        );
      }

      return event;
    },

    // Antes de enviar breadcrumbs (eventos de log), filtra também
    beforeBreadcrumb(breadcrumb, hint) {
      // Não loga fetches de Supabase Auth (têm tokens)
      if (
        breadcrumb.category === "fetch" &&
        breadcrumb.data?.url?.includes("/auth/")
      ) {
        return null;
      }
      return breadcrumb;
    },
  });
}

/**
 * Set user context para Sentry após login.
 * Chame em src/contexts/AuthContext.tsx após signIn bem-sucedido.
 */
export function setSentryUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Captura erro manual com contexto extra.
 * Use em catch blocks importantes:
 *
 *   try {
 *     await dangerousOperation();
 *   } catch (err) {
 *     captureError(err, { module: "disc-analyzer", contactId });
 *   }
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Wrap da App com ErrorBoundary do Sentry.
 * Use em main.tsx:
 *
 *   import { SentryErrorBoundary } from "@/lib/sentry";
 *
 *   <SentryErrorBoundary>
 *     <App />
 *   </SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
