import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";
import { CelebrationProvider } from "@/components/celebrations/CelebrationProvider";
import { KeyboardShortcutsDialogEnhanced } from "@/components/keyboard/KeyboardShortcutsDialogEnhanced";
import { InstallPrompt, OfflineIndicator, NetworkStatusBadge } from "@/components/pwa/PWAComponents";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { PageTransition } from "@/components/page-transition/PageTransition";
import { AriaLiveProvider } from "@/components/feedback/AriaLiveRegion";
import { WhatsNewModal } from "@/components/features/WhatsNewModal";
import { SessionExpiryHandler } from "@/components/session/SessionExpiryHandler";
import { useEasterEggs } from "@/hooks/useEasterEggs";

import Index from "./pages/Index";
import Analytics from "./pages/Analytics";
import Empresas from "./pages/Empresas";
import EmpresaDetalhe from "./pages/EmpresaDetalhe";
import Contatos from "./pages/Contatos";
import ContatoDetalhe from "./pages/ContatoDetalhe";
import Interacoes from "./pages/Interacoes";
import Insights from "./pages/Insights";
import Configuracoes from "./pages/Configuracoes";
import Calendario from "./pages/Calendario";
import Notificacoes from "./pages/Notificacoes";
import Network from "./pages/Network";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import RelatorioContato from "./pages/RelatorioContato";

import DesignSystem from "./pages/DesignSystem";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Easter eggs component
const EasterEggsProvider = () => {
  useEasterEggs();
  return null;
};

// What's New modal component - shows automatically when there are new features
const WhatsNewWrapper = () => {
  return <WhatsNewModal />;
};

// Animated routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/onboarding" element={
          <RequireAuth>
            <PageTransition><Onboarding /></PageTransition>
          </RequireAuth>
        } />
        
        {/* Protected routes */}
        <Route path="/" element={
          <RequireAuth>
            <PageTransition><Index /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/empresas" element={
          <RequireAuth>
            <PageTransition><Empresas /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/empresas/:id" element={
          <RequireAuth>
            <EmpresaDetalhe />
          </RequireAuth>
        } />
        <Route path="/contatos" element={
          <RequireAuth>
            <PageTransition><Contatos /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/contatos/:id" element={
          <RequireAuth>
            <ContatoDetalhe />
          </RequireAuth>
        } />
        <Route path="/interacoes" element={
          <RequireAuth>
            <PageTransition><Interacoes /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/insights" element={
          <RequireAuth>
            <PageTransition><Insights /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/analytics" element={
          <RequireAuth>
            <PageTransition><Analytics /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/configuracoes" element={
          <RequireAuth>
            <PageTransition><Configuracoes /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/calendario" element={
          <RequireAuth>
            <PageTransition><Calendario /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/notificacoes" element={
          <RequireAuth>
            <PageTransition><Notificacoes /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/network" element={
          <RequireAuth>
            <PageTransition><Network /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/relatorio/:id" element={
          <RequireAuth>
            <PageTransition><RelatorioContato /></PageTransition>
          </RequireAuth>
        } />
        <Route path="/whatsapp" element={
          <RequireAuth>
            <Navigate to="/interacoes?canal=whatsapp" replace />
          </RequireAuth>
        } />
        <Route path="/design-system" element={
          <PageTransition><DesignSystem /></PageTransition>
        } />
            
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <QueryClientProvider client={queryClient}>
      <CelebrationProvider>
        <AriaLiveProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <InstallPrompt />
            <NetworkStatusBadge />
            <BrowserRouter>
              <EasterEggsProvider />
              <KeyboardShortcutsDialogEnhanced />
              <WhatsNewWrapper />
              <AuthProvider>
                <SessionExpiryHandler>
                  <AnimatedRoutes />
                </SessionExpiryHandler>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </AriaLiveProvider>
      </CelebrationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
