import { lazy, Suspense, useEffect, useState } from 'react';
import { assertProviderOrder } from '@/lib/providerGuard';
import { ProviderErrorBoundary } from '@/components/feedback/ProviderErrorBoundary';
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
import { SkipNav } from "@/components/navigation/SkipNav";
import { useWebVitals } from "@/hooks/useWebVitals";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useCircuitBreakerHandler } from "@/hooks/useCircuitBreakerHandler";
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
import Index from "./pages/Index";

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
const Analytics = lazy(() => import("./pages/Analytics"));
const Empresas = lazy(() => import("./pages/Empresas"));
const EmpresaDetalhe = lazy(() => import("./pages/EmpresaDetalhe"));
const Contatos = lazy(() => import("./pages/Contatos"));
const ContatoDetalhe = lazy(() => import("./pages/ContatoDetalhe"));
const Interacoes = lazy(() => import("./pages/Interacoes"));
const PipelinePage = lazy(() => import("./pages/Pipeline"));
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
const Sequencias = lazy(() => import("./pages/Sequencias"));
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const MapaEmpresas = lazy(() => import("./pages/MapaEmpresas"));
const Metas = lazy(() => import("./pages/Metas"));
const Tarefas = lazy(() => import("./pages/Tarefas"));
const Territorios = lazy(() => import("./pages/Territorios"));
const TerritoryOptimization = lazy(() => import("./pages/TerritoryOptimization"));
const ABM = lazy(() => import("./pages/ABM"));
const ABMAccountDetail = lazy(() => import("./pages/ABMAccountDetail"));
const ABMCampaigns = lazy(() => import("./pages/ABMCampaigns"));
const Rodizio = lazy(() => import("./pages/Rodizio"));
const Performance = lazy(() => import("./pages/Performance"));
const BIAvancado = lazy(() => import("./pages/BIAvancado"));
const Suporte = lazy(() => import("./pages/Suporte"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));
const CustomReports = lazy(() => import("./pages/CustomReports"));
const Assistente = lazy(() => import("./pages/Assistente"));
const NPS = lazy(() => import("./pages/NPS"));
const PublicSurvey = lazy(() => import("./pages/PublicSurvey"));
const Campanhas = lazy(() => import("./pages/Campanhas"));
const SmsMarketing = lazy(() => import("./pages/SmsMarketing"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const Nurturing = lazy(() => import("./pages/Nurturing"));
const LandingPagesPage = lazy(() => import("./pages/LandingPages"));
const PublicLandingPage = lazy(() => import("./pages/PublicLandingPage"));
const AdminTelemetria = lazy(() => import("./pages/AdminTelemetria"));
const AdminSchemaDrift = lazy(() => import("./pages/AdminSchemaDrift"));
const AdminFieldMapping = lazy(() => import("./pages/AdminFieldMapping"));
const AdminEmailDiagnostics = lazy(() => import("./pages/AdminEmailDiagnostics"));
const AdminVoiceDiagnostics = lazy(() => import("./pages/AdminVoiceDiagnostics"));
const AdminLuxConfig = lazy(() => import("./pages/AdminLuxConfig"));
const Deduplicacao = lazy(() => import("./pages/Deduplicacao"));
const ErpViewer = lazy(() => import("./pages/ErpViewer"));
const Documentos = lazy(() => import("./pages/Documentos"));
const PublicSignaturePage = lazy(() => import("./pages/PublicSignaturePage"));
const SecurityPage = lazy(() => import("./pages/Security"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SSOCallbackPage = lazy(() => import("./pages/SSOCallbackPage"));
const RolesPage = lazy(() => import("./pages/RolesPage"));
const PermissionsPage = lazy(() => import("./pages/PermissionsPage"));
const RolePermissionsPage = lazy(() => import("./pages/RolePermissionsPage"));
const AdminSegurancaPage = lazy(() => import("./pages/admin/AdminSegurancaPage"));
const AdminSecretsManagement = lazy(() => import("./pages/AdminSecretsManagement"));
const AdminKnowledgeExport = lazy(() => import("./pages/AdminKnowledgeExport"));
const AdminAuditTrail = lazy(() => import("./pages/AdminAuditTrail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const StatusPage = lazy(() => import("./pages/StatusPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const RequireAdminLazy = lazy(() => import("@/components/admin/RequireAdmin").then(m => ({ default: m.RequireAdmin })));
const SchemaDriftBannerLazy = lazy(() => import("@/components/admin/SchemaDriftBanner").then(m => ({ default: m.SchemaDriftBanner })));
const IntentPage = lazy(() => import("./pages/Intent"));
const IntentSetupPage = lazy(() => import("./pages/IntentSetup"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Não retry em erros 4xx (erros do cliente)
        if (error instanceof Error && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Easter eggs — loaded after idle (with graceful fallback on import failure)
const EasterEggsProvider = lazy(() =>
  import("@/hooks/useEasterEggs")
    .then(m => ({
      default: () => { m.useEasterEggs(); return null; },
    }))
    .catch(() => ({
      default: () => null,
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

const DeferredAppChrome = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(false);

    if (location.pathname === '/auth') return;

    const timer = window.setTimeout(() => {
      setIsReady(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const shouldLoadAuthenticatedChrome = isReady && !!user && location.pathname !== '/auth';
  const shouldLoadShell = isReady && location.pathname !== '/auth';

  return (
    <>
      {shouldLoadShell && (
        <Suspense fallback={null}>
          <PWAShell />
        </Suspense>
      )}

      {shouldLoadAuthenticatedChrome && (
        <>
          <Suspense fallback={null}>
            <SchemaDriftBannerLazy />
          </Suspense>

          <Suspense fallback={null}>
            <EasterEggsProvider />
          </Suspense>

          <Suspense fallback={null}>
            <KeyboardShortcutsDialogEnhanced />
          </Suspense>

          <Suspense fallback={null}>
            <SessionExpiryHandler />
          </Suspense>

          <WhatsNewWrapper />
        </>
      )}
    </>
  );
};

// Suspense wrapper for lazy routes with optional custom fallback
const LazyPage = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => (
  <ErrorBoundary showDetails={import.meta.env.DEV}>
    <Suspense fallback={fallback || <PageLoadingFallback />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Routes wrapper
const AnimatedRoutes = () => {
  useWebVitals();
  const { isOnline } = useOnlineStatus({
    onOffline: () => import('sonner').then(m => m.toast.warning('Conexão perdida', { description: 'Você está offline.' })),
    onOnline: () => import('sonner').then(m => m.toast.success('Conexão restaurada')),
  });
  useCircuitBreakerHandler();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<LazyPage><Auth /></LazyPage>} />
      <Route path="/survey/:token" element={<LazyPage><PublicSurvey /></LazyPage>} />
      <Route path="/lp/:slug" element={<LazyPage><PublicLandingPage /></LazyPage>} />
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
          <LazyPage fallback={<CompaniesPageSkeleton />}><EmpresaDetalhe /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/contatos" element={
        <RequireAuth>
          <LazyPage fallback={<ContactsPageSkeleton />}><Contatos /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/contatos/:id" element={
        <RequireAuth>
          <LazyPage fallback={<ContactsPageSkeleton />}><ContatoDetalhe /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/interacoes" element={
        <RequireAuth>
          <LazyPage fallback={<InteractionsPageSkeleton />}><Interacoes /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/pipeline" element={
        <RequireAuth>
          <LazyPage><PipelinePage /></LazyPage>
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
      <Route path="/sequencias" element={
        <RequireAuth>
          <LazyPage><Sequencias /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/mapa-empresas" element={
        <RequireAuth>
          <LazyPage><MapaEmpresas /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/metas" element={
        <RequireAuth>
          <LazyPage><Metas /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/performance" element={
        <RequireAuth>
          <LazyPage><Performance /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/territorios" element={
        <RequireAuth>
          <LazyPage><Territorios /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/territory-optimization" element={
        <RequireAuth>
          <LazyPage><TerritoryOptimization /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/abm" element={
        <RequireAuth>
          <LazyPage><ABM /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/abm/campanhas" element={
        <RequireAuth>
          <LazyPage><ABMCampaigns /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/abm/:id" element={
        <RequireAuth>
          <LazyPage><ABMAccountDetail /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/intent" element={
        <RequireAuth>
          <LazyPage><IntentPage /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/intent/setup" element={
        <RequireAuth>
          <LazyPage><IntentSetupPage /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/rodizio" element={
        <RequireAuth>
          <LazyPage><Rodizio /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/tarefas" element={
        <RequireAuth>
          <LazyPage><Tarefas /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/bi" element={
        <RequireAuth>
          <LazyPage><BIAvancado /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/suporte" element={
        <RequireAuth>
          <LazyPage><Suporte /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/report-builder" element={
        <RequireAuth>
          <LazyPage><ReportBuilder /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/relatorios-customizaveis" element={
        <RequireAuth>
          <LazyPage><CustomReports /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/assistente" element={
        <RequireAuth>
          <LazyPage><Assistente /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/nps" element={
        <RequireAuth>
          <LazyPage><NPS /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/campanhas" element={
        <RequireAuth>
          <LazyPage><Campanhas /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/sms-marketing" element={
        <RequireAuth>
          <LazyPage><SmsMarketing /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/knowledge-base" element={
        <RequireAuth>
          <LazyPage><KnowledgeBase /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/nurturing" element={
        <RequireAuth>
          <LazyPage><Nurturing /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/landing-pages" element={
        <RequireAuth>
          <LazyPage><LandingPagesPage /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/deduplicacao" element={
        <RequireAuth>
          <LazyPage><Deduplicacao /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/erp" element={
        <RequireAuth>
          <LazyPage><ErpViewer /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/documentos" element={
        <RequireAuth>
          <LazyPage><Documentos /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/signature/:token" element={<LazyPage><PublicSignaturePage /></LazyPage>} />
      <Route path="/whatsapp" element={
        <RequireAuth>
          <Navigate to="/interacoes?canal=whatsapp" replace />
        </RequireAuth>
      } />
      <Route path="/design-system" element={
        <LazyPage><DesignSystem /></LazyPage>
      } />
      <Route path="/seguranca" element={
        <RequireAuth>
          <LazyPage><SecurityPage /></LazyPage>
        </RequireAuth>
      } />
      <Route path="/reset-password" element={
        <LazyPage><ResetPassword /></LazyPage>
      } />
      <Route path="/sso/callback" element={
        <LazyPage><SSOCallbackPage /></LazyPage>
      } />
      <Route path="/admin/roles" element={
        <RequireAuth><LazyPage><RequireAdminLazy><RolesPage /></RequireAdminLazy></LazyPage></RequireAuth>
      } />
      <Route path="/admin/permissions" element={
        <RequireAuth><LazyPage><RequireAdminLazy><PermissionsPage /></RequireAdminLazy></LazyPage></RequireAuth>
      } />
      <Route path="/admin/role-permissions" element={
        <RequireAuth><LazyPage><RequireAdminLazy><RolePermissionsPage /></RequireAdminLazy></LazyPage></RequireAuth>
      } />
      <Route path="/admin/seguranca" element={
        <RequireAuth><LazyPage><RequireAdminLazy><AdminSegurancaPage /></RequireAdminLazy></LazyPage></RequireAuth>
      } />
      <Route path="/admin" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminDashboard />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
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
      <Route path="/admin/schema-drift" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminSchemaDrift />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />
      <Route path="/admin/field-mapping" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminFieldMapping />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />
      <Route path="/admin/email-diagnostics" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminEmailDiagnostics />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />
      <Route path="/admin/voice-diagnostics" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminVoiceDiagnostics />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />
      <Route path="/admin/lux-config" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminLuxConfig />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />
      <Route path="/admin/secrets-management" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminSecretsManagement />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />

      <Route path="/admin/audit-trail" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminAuditTrail />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />
      <Route path="/admin/knowledge-export" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <AdminKnowledgeExport />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />

      <Route path="/admin/docs" element={
        <RequireAuth>
          <LazyPage>
            <RequireAdminLazy>
              <DocsPage />
            </RequireAdminLazy>
          </LazyPage>
        </RequireAuth>
      } />

      {/* Public status page — no auth required */}
      <Route path="/status" element={<LazyPage><StatusPage /></LazyPage>} />

      {/* Catch-all */}
      <Route path="*" element={<LazyPage><NotFound /></LazyPage>} />
    </Routes>
  );
};

/* ═══════════════════════════════════════════════════════════════════
 * PROVIDER HIERARCHY — ORDEM OBRIGATÓRIA (NÃO ALTERAR SEM VALIDAR)
 * 
 * 1. HelmetProvider          — sem dependências
 * 2. ErrorBoundary           — sem dependências (captura erros globais)
 * 3. QueryClientProvider     — sem dependências (TanStack Query)
 * 4. CelebrationProvider     — sem dependências
 * 5. AriaLiveProvider        — sem dependências (acessibilidade)
 * 6. TooltipProvider         — sem dependências
 * 7. BrowserRouter           — sem dependências (React Router)
 * 8. AuthProvider            — DEPENDE de BrowserRouter + QueryClientProvider
 * 9. NavigationStackProvider — DEPENDE de BrowserRouter
 * 
 * ⚠️ Alterar esta ordem PODE causar tela branca (white-screen crash).
 * Consulte: mem://architecture/provider-hierarchy-and-context
 * ═══════════════════════════════════════════════════════════════════ */

// DEV-only: validate provider order at startup
if (import.meta.env.DEV) {
  assertProviderOrder([
    'HelmetProvider',
    'ErrorBoundary',
    'QueryClientProvider',
    'CelebrationProvider',
    'AriaLiveProvider',
    'TooltipProvider',
    'BrowserRouter',
    'AuthProvider',
    'NavigationStackProvider',
  ]);
}

const App = () => (
  /* ── Layer 1: Meta & Error Boundary (sem dependências) ── */
  <HelmetProvider>
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      {/* ── Layer 2: Data & UI Infra ── */}
      <QueryClientProvider client={queryClient}>
        <CelebrationProvider>
          <AriaLiveProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {/* ── Layer 3: Routing ── */}
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <SkipNav />
                {/* ── Layer 4: Auth (depende de Router + Query) ── */}
                <ProviderErrorBoundary providerName="AuthProvider">
                  <AuthProvider>
                    {/* ── Layer 5: Navigation Stack (depende de Router) ── */}
                    <ProviderErrorBoundary providerName="NavigationStackProvider">
                      <NavigationStackProvider>
                        <ScrollToTop />
                        <RouteAnnouncer />
                        <AnimatedRoutes />
                        <DeferredAppChrome />
                      </NavigationStackProvider>
                    </ProviderErrorBoundary>
                  </AuthProvider>
                </ProviderErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </AriaLiveProvider>
        </CelebrationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </HelmetProvider>
);

export default App;
