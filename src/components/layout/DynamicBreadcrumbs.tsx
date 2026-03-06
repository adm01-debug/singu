import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbConfig {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface DynamicBreadcrumbsProps {
  items?: BreadcrumbConfig[];
  currentPage: string;
  className?: string;
}

const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  empresas: 'Empresas',
  contatos: 'Contatos',
  interacoes: 'Interações',
  insights: 'Insights',
  calendario: 'Calendário',
  configuracoes: 'Configurações',
  notificacoes: 'Notificações',
};

const isDetailSegment = (segment: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) || /^\d+$/.test(segment);

export function DynamicBreadcrumbs({ items, currentPage, className }: DynamicBreadcrumbsProps) {
  const location = useLocation();

  const breadcrumbItems: BreadcrumbConfig[] = items ?? (() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return [];

    let currentPath = '';
    return pathSegments
      .map((segment, index) => {
        currentPath += `/${segment}`;
        if (isDetailSegment(segment) || index >= pathSegments.length - 1) return null;

        return {
          label: routeLabels[segment] ?? `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`,
          href: currentPath,
        } as BreadcrumbConfig;
      })
      .filter((item): item is BreadcrumbConfig => Boolean(item));
  })();

  const showTrail = breadcrumbItems.length > 0 || Boolean(currentPage);

  return (
    <nav aria-label="breadcrumb" className={cn('mb-4', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5">
        <li className="inline-flex items-center gap-1.5">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
            <Home className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Início</span>
          </Link>
        </li>

        {showTrail && (
          <li role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </li>
        )}

        {breadcrumbItems.flatMap((item, index) => [
          <li key={`crumb-${index}`} className="inline-flex items-center gap-1.5">
            <Link
              to={item.href ?? '#'}
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.icon}
              {item.label}
            </Link>
          </li>,
          <li key={`sep-${index}`} role="presentation" aria-hidden="true" className="[&>svg]:size-3.5">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </li>,
        ])}

        <li className="inline-flex items-center gap-1.5">
          <span role="link" aria-disabled="true" aria-current="page" className="font-medium text-foreground">
            {currentPage}
          </span>
        </li>
      </ol>
    </nav>
  );
}
