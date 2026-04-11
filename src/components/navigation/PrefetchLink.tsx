import { useCallback, type ReactNode, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

/** Maps route prefixes to their lazy chunk import */
const routeChunks: Record<string, () => Promise<unknown>> = {
  '/empresas': () => import('@/pages/Empresas'),
  '/contatos': () => import('@/pages/Contatos'),
  '/interacoes': () => import('@/pages/Interacoes'),
  '/analytics': () => import('@/pages/Analytics'),
  '/insights': () => import('@/pages/Insights'),
  '/calendario': () => import('@/pages/Calendario'),
  '/configuracoes': () => import('@/pages/Configuracoes'),
};

const prefetched = new Set<string>();

function prefetchRoute(path: string) {
  const key = Object.keys(routeChunks).find(k => path.startsWith(k));
  if (key && !prefetched.has(key)) {
    prefetched.add(key);
    routeChunks[key]();
  }
}

interface PrefetchLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: MouseEvent) => void;
}

export function PrefetchLink({ to, children, className, onClick }: PrefetchLinkProps) {
  const navigate = useNavigate();

  const handleMouseEnter = useCallback(() => {
    prefetchRoute(to);
  }, [to]);

  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    onClick?.(e);
    navigate(to);
  }, [to, navigate, onClick]);

  return (
    <a
      href={to}
      className={className}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}

/** Hook to prefetch a route on demand (e.g., on hover of a non-link element) */
export function usePrefetch() {
  return { prefetch: prefetchRoute };
}
