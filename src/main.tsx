import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import { initializeCustomTheme } from "@/components/settings/ThemeCustomizer";
import { initWebVitals } from "@/lib/web-vitals";
import { errorReporter } from "@/lib/error-reporter";
import App from "./App.tsx";
import "./index.css";

// Inicializar sistemas globais
initGlobalErrorHandlers();
initializeCustomTheme();
errorReporter.init();

// Monitor Web Vitals in production and development
initWebVitals({
  onMetric: (metric) => {
    if (metric.rating === 'poor') {
      errorReporter.captureWarning(
        `Poor Web Vital: ${metric.name} = ${metric.value}`,
        { context: 'web-vitals', tags: { metric: metric.name, rating: metric.rating } }
      );
    }
  },
});

// Limpa service workers e caches legados para evitar bundle antigo quebrado no preview
void (async () => {
  try {
    let cleaned = false;

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      cleaned = cleaned || registrations.length > 0;
    }

    if ('caches' in window) {
      const keys = await caches.keys();
      const keysToDelete = keys.filter((key) =>
        key.includes('workbox') || key.includes('supabase') || key.includes('vite') || key.includes('precache')
      );

      await Promise.all(keysToDelete.map((key) => caches.delete(key)));
      cleaned = cleaned || keysToDelete.length > 0;
    }

    const reloadKey = 'relateiq-cache-cleanup-reloaded';
    if (cleaned && !sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1');
      window.location.reload();
    }
  } catch {
    // noop: falha de limpeza não deve impedir bootstrap do app
  }
})();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="relateiq-theme">
    <App />
  </ThemeProvider>
);
