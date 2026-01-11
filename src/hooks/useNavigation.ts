import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface RoutePreloadConfig {
  path: string;
  preloadFn: () => Promise<void>;
  priority?: 'high' | 'low';
}

// Preload routes on hover/focus
export function useRoutePreload(routes: RoutePreloadConfig[]) {
  const preloadedRoutes = useRef(new Set<string>());

  const preloadRoute = useCallback((path: string) => {
    if (preloadedRoutes.current.has(path)) return;
    
    const route = routes.find(r => r.path === path);
    if (route) {
      preloadedRoutes.current.add(path);
      route.preloadFn();
    }
  }, [routes]);

  return { preloadRoute };
}

// Track navigation history for better UX
export function useNavigationHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const historyStack = useRef<string[]>([]);
  const forwardStack = useRef<string[]>([]);

  useEffect(() => {
    historyStack.current.push(location.pathname);
  }, [location.pathname]);

  const goBack = useCallback(() => {
    if (historyStack.current.length > 1) {
      const current = historyStack.current.pop();
      if (current) {
        forwardStack.current.push(current);
      }
      const previous = historyStack.current[historyStack.current.length - 1];
      if (previous) {
        navigate(previous);
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const goForward = useCallback(() => {
    if (forwardStack.current.length > 0) {
      const next = forwardStack.current.pop();
      if (next) {
        navigate(next);
      }
    }
  }, [navigate]);

  const canGoBack = historyStack.current.length > 1;
  const canGoForward = forwardStack.current.length > 0;

  return {
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    history: historyStack.current,
    currentPath: location.pathname,
  };
}

// Announce route changes to screen readers
export function useRouteAnnouncer() {
  const location = useLocation();
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    // Get page title from document or route
    const pageTitle = document.title || 'Página carregada';
    
    // Announce the navigation
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navegou para ${pageTitle}`;
    }

    // Focus main content for keyboard users
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }

    return () => {
      if (announcerRef.current) {
        announcerRef.current.textContent = '';
      }
    };
  }, [location.pathname]);
}

// Breadcrumb generation from route
interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/contatos': 'Contatos',
  '/empresas': 'Empresas',
  '/interacoes': 'Interações',
  '/calendario': 'Calendário',
  '/analytics': 'Analytics',
  '/insights': 'Insights',
  '/network': 'Rede',
  '/notificacoes': 'Notificações',
  '/configuracoes': 'Configurações',
};

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', path: '/', isActive: location.pathname === '/' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isActive = index === pathSegments.length - 1;
    
    // Try to get label from route labels or format the segment
    let label = routeLabels[currentPath];
    if (!label) {
      // Check if it's a UUID (entity detail page)
      if (segment.match(/^[0-9a-f-]{36}$/i)) {
        label = 'Detalhes';
      } else {
        // Capitalize and format
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      }
    }

    breadcrumbs.push({
      label,
      path: currentPath,
      isActive,
    });
  });

  return breadcrumbs;
}

// Scroll restoration
export function useScrollRestoration() {
  const location = useLocation();
  const scrollPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    // Save current scroll position before navigating away
    const saveScrollPosition = () => {
      scrollPositions.current[location.key || location.pathname] = window.scrollY;
    };

    window.addEventListener('beforeunload', saveScrollPosition);
    
    return () => {
      saveScrollPosition();
      window.removeEventListener('beforeunload', saveScrollPosition);
    };
  }, [location]);

  useEffect(() => {
    // Restore scroll position or scroll to top
    const savedPosition = scrollPositions.current[location.key || location.pathname];
    
    if (savedPosition !== undefined) {
      window.scrollTo(0, savedPosition);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
}

// Page visibility tracking
export function usePageVisibility() {
  const isVisible = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}
