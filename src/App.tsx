import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";
import { CelebrationProvider } from "@/components/celebrations/CelebrationProvider";
import { KeyboardShortcutsDialogEnhanced } from "@/components/keyboard/KeyboardShortcutsDialogEnhanced";
import { InstallPrompt, OfflineIndicator, NetworkStatusBadge } from "@/components/pwa/PWAComponents";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
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

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
    <QueryClientProvider client={queryClient}>
      <CelebrationProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <InstallPrompt />
      <NetworkStatusBadge />
      <BrowserRouter>
        <KeyboardShortcutsDialogEnhanced />
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={
              <RequireAuth>
                <Onboarding />
              </RequireAuth>
            } />
            
            {/* Protected routes */}
            <Route path="/" element={
              <RequireAuth>
                <Index />
              </RequireAuth>
            } />
            <Route path="/empresas" element={
              <RequireAuth>
                <Empresas />
              </RequireAuth>
            } />
            <Route path="/empresas/:id" element={
              <RequireAuth>
                <EmpresaDetalhe />
              </RequireAuth>
            } />
            <Route path="/contatos" element={
              <RequireAuth>
                <Contatos />
              </RequireAuth>
            } />
            <Route path="/contatos/:id" element={
              <RequireAuth>
                <ContatoDetalhe />
              </RequireAuth>
            } />
            <Route path="/interacoes" element={
              <RequireAuth>
                <Interacoes />
              </RequireAuth>
            } />
            <Route path="/insights" element={
              <RequireAuth>
                <Insights />
              </RequireAuth>
            } />
            <Route path="/analytics" element={
              <RequireAuth>
                <Analytics />
              </RequireAuth>
            } />
            <Route path="/configuracoes" element={
              <RequireAuth>
                <Configuracoes />
              </RequireAuth>
            } />
            <Route path="/calendario" element={
              <RequireAuth>
                <Calendario />
              </RequireAuth>
            } />
            <Route path="/notificacoes" element={
              <RequireAuth>
                <Notificacoes />
              </RequireAuth>
            } />
            <Route path="/network" element={
              <RequireAuth>
                <Network />
              </RequireAuth>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
      </CelebrationProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
