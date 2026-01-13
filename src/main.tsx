import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import { initializeCustomTheme } from "@/components/settings/ThemeCustomizer";
import App from "./App.tsx";
import "./index.css";

// Inicializar sistemas globais
initGlobalErrorHandlers();
initializeCustomTheme();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="relateiq-theme">
    <App />
  </ThemeProvider>
);
