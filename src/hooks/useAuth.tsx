import { useState, useEffect, createContext, useContext, ReactNode, forwardRef, useCallback, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tempo antes da expiração para refresh automático (5 minutos)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Module-level singleton for fetch interceptor
let fetchInterceptorInstalled = false;
let originalFetch: typeof window.fetch | null = null;
let refreshPromise: Promise<any> | null = null;
let activeProviderCount = 0;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHandling401Ref = useRef(false);

  // Função para agendar refresh automático
  const scheduleTokenRefresh = useCallback((currentSession: Session | null) => {
    // Limpar timeout anterior
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    if (!currentSession?.expires_at) return;

    const expiresAt = currentSession.expires_at * 1000; // Converter para ms
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;
    const refreshTime = timeUntilExpiry - REFRESH_THRESHOLD_MS;

    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            toast.error('Sua sessão expirou. Por favor, faça login novamente.');
          } else if (data.session) {
            scheduleTokenRefresh(data.session);
          }
        } catch {
          // Refresh failed silently
        }
      }, refreshTime);
    }
  }, []);

  // Refresh manual da sessão
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        scheduleTokenRefresh(data.session);
      }
    } catch (err) {
      logger.error('Error refreshing session:', err);
      toast.error('Erro ao atualizar sessão.');
    }
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession) => {
        logger.log('🔐 Auth event:', event);
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Tratar diferentes eventos de auth
        switch (event) {
          case 'SIGNED_IN':
            scheduleTokenRefresh(newSession);
            toast.success('Login realizado com sucesso!');
            break;
            
          case 'SIGNED_OUT':
            if (refreshTimeoutRef.current) {
              clearTimeout(refreshTimeoutRef.current);
              refreshTimeoutRef.current = null;
            }
            break;
            
          case 'TOKEN_REFRESHED':
            logger.log('🔄 Token refreshed via auth event');
            scheduleTokenRefresh(newSession);
            break;
            
          case 'USER_UPDATED':
            toast.success('Perfil atualizado!');
            break;
            
          case 'PASSWORD_RECOVERY':
            toast.info('Siga as instruções para recuperar sua senha.');
            break;
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      
      if (existingSession) {
        scheduleTokenRefresh(existingSession);
      }
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [scheduleTokenRefresh]);

  // Interceptar erros 401 globalmente (singleton pattern with ref counting)
  useEffect(() => {
    activeProviderCount++;

    if (!fetchInterceptorInstalled) {
      fetchInterceptorInstalled = true;
      originalFetch = window.fetch;

      window.fetch = async (...args) => {
        const response = await originalFetch!(...args);

        if (response.status !== 401) return response;

        const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
        const isBackendRequest =
          url.includes('/auth/v1') || url.includes('/rest/v1') || url.includes('/functions/v1') || url.includes('supabase');
        const isRefreshRequest = url.includes('/auth/v1/token');

        if (!isBackendRequest || isRefreshRequest) {
          return response;
        }

        try {
          if (!refreshPromise) {
            refreshPromise = supabase.auth.refreshSession().finally(() => {
              refreshPromise = null;
            });
          }
          const { data } = await refreshPromise;
          if (!data?.session) {
            toast.error('Sua sessão expirou. Por favor, faça login novamente.');
            await supabase.auth.signOut();
          }
        } catch {
          // Session refresh failed silently
        }

        return response;
      };
    }

    return () => {
      activeProviderCount--;
      if (activeProviderCount === 0 && originalFetch) {
        window.fetch = originalFetch;
        originalFetch = null;
        fetchInterceptorInstalled = false;
      }
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: new Error('Este email já está cadastrado. Tente fazer login.') };
        }
        return { error };
      }

      return { error: null, needsEmailVerification: !data.session };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { error: new Error('Email ou senha incorretos.') };
        }
        return { error };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route wrapper - using forwardRef to avoid ref warnings
interface RequireAuthProps {
  children: ReactNode;
}

export const RequireAuth = forwardRef<HTMLDivElement, RequireAuthProps>(
  function RequireAuth({ children }, ref) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
      if (!loading && !user) {
        const returnTo = `${location.pathname}${location.search}${location.hash}`;
        navigate('/auth', { replace: true, state: { from: returnTo } });
      }
    }, [user, loading, navigate, location.pathname, location.search, location.hash]);

    if (loading) {
      return (
        <div ref={ref} className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <>{children}</>;
  }
);

RequireAuth.displayName = 'RequireAuth';
