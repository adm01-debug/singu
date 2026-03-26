import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, RequireAuth, useAuth } from "@/hooks/useAuth";
import { CelebrationProvider } from "@/components/celebrations/CelebrationProvider";
import { KeyboardShortcutsDialogEnhanced } from "@/components/keyboard/KeyboardShortcutsDialogEnhanced";
import { InstallPrompt, OfflineIndicator, NetworkStatusBadge } from "@/components/pwa/PWAComponents";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { PageTransition } from "@/components/page-transition/PageTransition";
import { AriaLiveProvider } from "@/components/feedback/AriaLiveRegion";
import { WhatsNewModal } from "@/components/features/WhatsNewModal";
import { SessionExpiryHandler } from "@/components/session/SessionExpiryHandler";
import { useEasterEggs } from "@/hooks/useEasterEggs";

const Index = lazy(() => import("./pages/Index"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresaDetalhe = lazy(() => import("./pages/EmpresaDetalhe"));
const Contatos = lazy(() => import("./pages/Contatos"));
const ContatoDetalhe = lazy(() => import("./pages/ContatoDetalhe"));
const Interacoes = lazy(() => import("./pages/Interacoes"));
const Insights = lazy(() => import("./pages/Insights"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Calendario = lazy(() => import("./pages/Calendario"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Network = lazy(() => import("./pages/Network"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const RelatorioContato = lazy(() => import("./pages/RelatorioContato"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - CRM data needs freshness
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      refetchOnWindowFocus: true, // Refresh stale data on tab return
      retry: 2,
    },
  },
});

// Easter eggs component
const EasterEggsProvider = () => {
  useEasterEggs();
  return null;
};

// What's New modal component - only for authenticated users outside auth route
const WhatsNewWrapper = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || location.pathname === '/auth') return null;
  return <WhatsNewModal />;
};

// Routes wrapper
const AnimatedRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <PageTransition><Auth /></PageTransition>
          </Suspense>
        </ErrorBoundary>
      } />
      <Route path="/onboarding" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Onboarding /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Index /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/empresas" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Empresas /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/empresas/:id" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <EmpresaDetalhe />
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/contatos" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Contatos /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/contatos/:id" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <ContatoDetalhe />
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/interacoes" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Interacoes /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/insights" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Insights /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/analytics" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Analytics /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/configuracoes" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Configuracoes /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/calendario" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Calendario /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/notificacoes" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Notificacoes /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/network" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><Network /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/relatorio/:id" element={
        <RequireAuth>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <PageTransition><RelatorioContato /></PageTransition>
            </Suspense>
          </ErrorBoundary>
        </RequireAuth>
      } />
      <Route path="/whatsapp" element={
        <RequireAuth>
          <Navigate to="/interacoes?canal=whatsapp" replace />
        </RequireAuth>
      } />
      <Route path="/design-system" element={
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <PageTransition><DesignSystem /></PageTransition>
          </Suspense>
        </ErrorBoundary>
      } />

      {/* Catch-all */}
      <Route path="*" element={
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <PageTransition><NotFound /></PageTransition>
          </Suspense>
        </ErrorBoundary>
      } />
    </Routes>
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
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <EasterEggsProvider />
              <KeyboardShortcutsDialogEnhanced />
              <AuthProvider>
                <SessionExpiryHandler>
                  <WhatsNewWrapper />
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
