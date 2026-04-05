import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import App from "./App.tsx";
import "./index.css";

const LEGACY_THEME_STORAGE_KEYS = ["singu-skin"];
const LEGACY_THEME_STYLE_IDS = ["singu-skin-style"];

function cleanupLegacyTheme() {
  try {
    LEGACY_THEME_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    LEGACY_THEME_STYLE_IDS.forEach((id) => document.getElementById(id)?.remove());
  } catch {
    // noop: limpeza legada não deve bloquear o app
  }
}

// Inicializar sistemas globais
initGlobalErrorHandlers();
cleanupLegacyTheme();

// Evita limpeza agressiva de cache em desenvolvimento para não atrasar o bootstrap.
if (import.meta.env.PROD) {
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
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="relateiq-theme">
    <App />
  </ThemeProvider>
);
