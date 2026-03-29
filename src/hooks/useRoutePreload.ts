import { useCallback, useRef } from 'react';

/**
 * Map of route paths to their lazy import functions.
 * Matches the lazy() calls in App.tsx.
 */
const routeImportMap: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/empresas': () => import('@/pages/Empresas'),
  '/contatos': () => import('@/pages/Contatos'),
  '/interacoes': () => import('@/pages/Interacoes'),
  '/calendario': () => import('@/pages/Calendario'),
  '/network': () => import('@/pages/Network'),
  '/insights': () => import('@/pages/Insights'),
  '/analytics': () => import('@/pages/Analytics'),
  '/automacoes': () => import('@/pages/Automacoes'),
  '/configuracoes': () => import('@/pages/Configuracoes'),
  '/notificacoes': () => import('@/pages/Notificacoes'),
};

const preloadedRoutes = new Set<string>();

/**
 * Hook that returns event handlers for preloading lazy routes.
 * Attach `onMouseEnter` and `onFocus` to nav links.
 * Each route is only preloaded once per session.
 */
export function useRoutePreload() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const preload = useCallback((path: string) => {
    if (preloadedRoutes.has(path)) return;
    const importFn = routeImportMap[path];
    if (!importFn) return;

    // Small delay to avoid preloading during quick mouse passes
    timerRef.current = setTimeout(() => {
      preloadedRoutes.add(path);
      importFn().catch(() => {
        // Silently fail — user will load normally on click
        preloadedRoutes.delete(path);
      });
    }, 100);
  }, []);

  const cancelPreload = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { preload, cancelPreload };
}
