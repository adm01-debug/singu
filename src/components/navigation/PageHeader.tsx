import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BackButton } from './BackButton';

interface BreadcrumbSegment {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  /** Back button destination. If omitted, uses browser history. */
  backTo?: string;
  /** Back button label. Defaults to parent breadcrumb label or "Voltar". */
  backLabel?: string;
  /** Breadcrumb segments (excluding current page). */
  breadcrumbs?: BreadcrumbSegment[];
  /** Current page title shown as last breadcrumb. */
  title: string;
  /** Actions rendered on the right side. */
  actions?: ReactNode;
  /** Back button variant */
  backVariant?: 'default' | 'ghost' | 'overlay';
  /** Additional classes */
  className?: string;
}

/**
 * Unified page header combining:
 * - Smart back button (left)
 * - Breadcrumb trail (center-left)
 * - Action buttons (right)
 */
export function PageHeader({
  backTo,
  backLabel,
  breadcrumbs = [],
  title,
  actions,
  backVariant = 'ghost',
  className,
}: PageHeaderProps) {
  const resolvedBackLabel = backLabel || (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Voltar');

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {/* Left: Back + Breadcrumbs */}
      <nav aria-label="breadcrumb" className="flex items-center gap-1 min-w-0">
        <BackButton
          to={backTo}
          label={resolvedBackLabel}
          variant={backVariant}
          showLabelOnMobile={breadcrumbs.length === 0}
        />

        {breadcrumbs.length > 0 && (
          <ol className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((segment, index) => (
              <li key={segment.path || index} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                {segment.path ? (
                  <Link
                    to={segment.path}
                    className="hover:text-foreground transition-colors truncate max-w-[150px]"
                  >
                    {segment.label}
                  </Link>
                ) : (
                  <span className="truncate max-w-[150px]">{segment.label}</span>
                )}
              </li>
            ))}
            <li className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
              <span className="font-medium text-foreground truncate max-w-[200px]" aria-current="page">
                {title}
              </span>
            </li>
          </ol>
        )}

        {/* Mobile: show only current title */}
        {breadcrumbs.length > 0 && (
          <span className="sm:hidden text-sm font-medium text-foreground truncate max-w-[180px]">
            {title}
          </span>
        )}
      </nav>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
