import { lazy, Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, RequireAuth, useAuth } from "@/hooks/useAuth";
import { NavigationStackProvider } from "@/contexts/NavigationStackContext";
import { CelebrationProvider } from "@/components/celebrations/CelebrationProvider";
import { AriaLiveProvider } from "@/components/feedback/AriaLiveRegion";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { PageLoadingFallback } from "@/components/feedback/PageLoadingFallback";
import { RouteAnnouncer } from "@/components/navigation/RouteAnnouncer";
import { useWebVitals } from "@/hooks/useWebVitals";
import ScrollToTop from "@/components/ScrollToTop";
import {
  ContactsPageSkeleton,
  CompaniesPageSkeleton,
  InteractionsPageSkeleton,
  AnalyticsPageSkeleton,
  InsightsPageSkeleton,
  CalendarPageSkeleton,
  SettingsPageSkeleton,
  NetworkPageSkeleton,
} from "@/components/skeletons/PageSkeletons";

// Non-critical shell components — lazy loaded
const PWAShell = lazy(() =>
  import("@/components/pwa/PWAComponents").then(({ OfflineIndicator, InstallPrompt, NetworkStatusBadge }) => ({
    default: function PWAShellInner() {
      return (
        <>
          <OfflineIndicator />
          <InstallPrompt />
          <NetworkStatusBadge />
        </>
      );
    },
  }))
);
const KeyboardShortcutsDialogEnhanced = lazy(() =>
  import("@/components/keyboard/KeyboardShortcutsDialogEnhanced").then(m => ({ default: m.KeyboardShortcutsDialogEnhanced }))
);
const SessionExpiryHandler = lazy(() =>
  import("@/components/session/SessionExpiryHandler").then(m => ({ default: m.SessionExpiryHandler }))
);
const WhatsNewModal = lazy(() =>
  import("@/components/features/WhatsNewModal").then(m => ({ default: m.WhatsNewModal }))
);

// Lazy-loaded pages — code splitting per route
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
const Automacoes = lazy(() => import("./pages/Automacoes"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const AdminTelemetria = lazy(() => import("./pages/AdminTelemetria"));
const RequireAdminLazy = lazy(() => import("@/components/admin/RequireAdmin").then(m => ({ default: m.RequireAdmin })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Easter eggs — loaded after idle
const EasterEggsProvider = lazy(() =>
  import("@/hooks/useEasterEggs").then(m => ({
    default: () => { m.useEasterEggs(); return null; },
  }))
);

// What's New — only for authenticated users outside auth route
const WhatsNewWrapper = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user || location.pathname === '/auth') return null;
  return (
    <Suspense fallback={null}>
      <WhatsNewModal />
    </Suspense>
  );
};

// Suspense wrapper for lazy routes with optional custom fallback
const LazyPage = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <Suspense fallback={fallback || <PageLoadingFallback />}>
    {children}
  </Suspense>
);

// Routes wrapper
const AnimatedRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<LazyPage><Auth /></LazyPage>} />
      <Route path="/onboarding" element={
        <RequireAuth>
          <LazyPage><Onboarding /></LazyPage>
        </RequireAuth>
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <RequireAuth>
          <LazyPage><Index /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/empresas" element={
        <RequireAuth>
          <LazyPage fallback={<CompaniesPageSkeleton />}><Empresas /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/empresas/:id" element={
        <RequireAuth>
          <Suspense fallback={<CompaniesPageSkeleton />}>
            <EmpresaDetalhe />
          </Suspense>
        </RequireAuth>
      } />
      <Route path="/contatos" element={
        <RequireAuth>
          <LazyPage fallback={<ContactsPageSkeleton />}><Contatos /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/contatos/:id" element={
        <RequireAuth>
          <Suspense fallback={<ContactsPageSkeleton />}>
            <ContatoDetalhe />
          </Suspense>
        </RequireAuth>
      } />
      <Route path="/interacoes" element={
        <RequireAuth>
          <LazyPage fallback={<InteractionsPageSkeleton />}><Interacoes /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/insights" element={
        <RequireAuth>
          <LazyPage fallback={<InsightsPageSkeleton />}><Insights /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/analytics" element={
        <RequireAuth>
          <LazyPage fallback={<AnalyticsPageSkeleton />}><Analytics /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/configuracoes" element={
        <RequireAuth>
          <LazyPage fallback={<SettingsPageSkeleton />}><Configuracoes /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/calendario" element={
        <RequireAuth>
          <LazyPage fallback={<CalendarPageSkeleton />}><Calendario /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/notificacoes" element={
        <RequireAuth>
          <LazyPage><Notificacoes /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/network" element={
        <RequireAuth>
          <LazyPage fallback={<NetworkPageSkeleton />}><Network /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/relatorio/:id" element={
        <RequireAuth>
          <LazyPage><RelatorioContato /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/automacoes" element={
        <RequireAuth>
          <LazyPage><Automacoes /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/whatsapp" element={
        <RequireAuth>
          <Navigate to="/interacoes?canal=whatsapp" replace />
        </RequireAuth>
      } />
      <Route path="/design-system" element={
        <LazyPage><DesignSystem /></LazyPage>
      } />
      <Route path="/admin/telemetria" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminTelemetria />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />

      {/* Catch-all */}
      <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
    </Routes>
  );
};

const App = () => (
  <HelmetProvider>
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <QueryClientProvider client={queryClient}>
        <CelebrationProvider>
          <AriaLiveProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={null}>
                <PWAShell />
              </Suspense>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                <NavigationStackProvider>
                    <ScrollToTop />
                    <Suspense fallback={null}>
                      <EasterEggsProvider />
                    </Suspense>
                    <Suspense fallback={null}>
                      <KeyboardShortcutsDialogEnhanced />
                    </Suspense>
                    <Suspense fallback={null}>
                      <SessionExpiryHandler>
                        <WhatsNewWrapper />
                        <RouteAnnouncer />
                        <AnimatedRoutes />
                      </SessionExpiryHandler>
                    </Suspense>
                  </NavigationStackProvider>
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AriaLiveProvider>
        </CelebrationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
