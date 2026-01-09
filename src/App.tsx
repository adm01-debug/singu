import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Empresas from "./pages/Empresas";
import Contatos from "./pages/Contatos";
import ContatoDetalhe from "./pages/ContatoDetalhe";
import Interacoes from "./pages/Interacoes";
import Insights from "./pages/Insights";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
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
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
