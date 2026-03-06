import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import { initializeCustomTheme } from "@/components/settings/ThemeCustomizer";
import App from "./App.tsx";
import "./index.css";

// Inicializar sistemas globais
initGlobalErrorHandlers();
initializeCustomTheme();

// Evita cache de bundles antigos no preview/dev (Service Worker legado)
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="relateiq-theme">
    <App />
  </ThemeProvider>
);
