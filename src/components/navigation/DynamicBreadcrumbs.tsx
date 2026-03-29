import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Map route segments to human-readable labels */
const segmentLabels: Record<string, string> = {
  '': 'Dashboard',
  'empresas': 'Empresas',
  'contatos': 'Contatos',
  'interacoes': 'Conversas',
  'calendario': 'Calendário',
  'network': 'Network',
  'insights': 'Insights',
  'analytics': 'Analytics',
  'automacoes': 'Automações',
  'configuracoes': 'Configurações',
  'notificacoes': 'Notificações',
};

interface BreadcrumbItem {
  label: string;
  path: string;
  isLast: boolean;
}

/**
 * Dynamic breadcrumbs component.
 * Automatically generates breadcrumbs from the current route.
 * Only shows when depth > 1 (i.e., not on root pages).
 */
export function DynamicBreadcrumbs({ className }: { className?: string }) {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumbs on root-level pages
  if (segments.length <= 1) return null;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Início', path: '/', isLast: false },
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    const label = segmentLabels[segment] || (isLast ? 'Detalhe' : segment);
    breadcrumbs.push({ label, path: currentPath, isLast });
  });

  return (
    <nav
      aria-label="Breadcrumbs"
      className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}
    >
      {breadcrumbs.map((item, index) => (
        <span key={item.path} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" aria-hidden="true" />
          )}
          {item.isLast ? (
            <span className="text-foreground font-medium truncate max-w-[150px]" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors truncate max-w-[120px] inline-flex items-center gap-1"
            >
              {index === 0 && <Home className="w-3 h-3 shrink-0" aria-hidden="true" />}
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
