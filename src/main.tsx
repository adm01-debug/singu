import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import { initializeCustomTheme } from "@/components/settings/ThemeCustomizer";
import App from "./App.tsx";
import "./index.css";

// Inicializar sistemas globais
initGlobalErrorHandlers();
initializeCustomTheme();

// Limpa service workers e caches legados para evitar bundle antigo quebrado no preview
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => {
      if (key.includes('workbox') || key.includes('supabase') || key.includes('vite')) {
        void caches.delete(key);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="relateiq-theme">
    <App />
  </ThemeProvider>
);
