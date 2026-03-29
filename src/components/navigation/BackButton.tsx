import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

/** Human-readable labels for route segments */
const ROUTE_LABELS: Record<string, string> = {
  '': 'início',
  contatos: 'Contatos',
  empresas: 'Empresas',
  interacoes: 'Interações',
  analytics: 'Analytics',
  insights: 'Insights',
  calendario: 'Calendário',
  notificacoes: 'Notificações',
  network: 'Network',
  automacoes: 'Automações',
  configuracoes: 'Configurações',
  relatorio: 'Relatório',
  admin: 'Admin',
};

function getReadableLabel(path: string | null): string {
  if (!path) return 'início';
  const segment = path.replace(/^\//, '').split('/')[0] || '';
  return ROUTE_LABELS[segment] || segment || 'início';
}

interface BackButtonProps {
  /** Explicit path to navigate to. If omitted, uses internal navigation stack. */
  to?: string;
  /** Label shown next to the arrow. Defaults to "Voltar". */
  label?: string;
  /** Visual variant */
  variant?: 'default' | 'ghost' | 'overlay';
  /** Additional classes */
  className?: string;
  /** Whether to show the label on mobile */
  showLabelOnMobile?: boolean;
}

/**
 * Smart back button that:
 * - Uses explicit `to` path when provided
 * - Falls back to internal navigation stack (anti-loop, deduplication)
 * - Falls back to "/" if stack is empty
 * - Shows contextual destination label
 * - Provides contextual aria-label with readable destination
 */
export function BackButton({
  to,
  label,
  variant = 'ghost',
  className,
  showLabelOnMobile = false,
}: BackButtonProps) {
  const { goBack, previousPath } = useNavigationStack();

  const handleBack = () => {
    if (to) {
      goBack(to);
    } else {
      goBack('/');
    }
  };

  // Resolve visible label: explicit > contextual destination > "Voltar"
  const destinationPath = to || previousPath;
  const contextualDestination = getReadableLabel(destinationPath);
  const displayLabel = label || contextualDestination;

  // Build accessible aria-label
  const ariaLabel = `Voltar para ${contextualDestination}`;

  const variantClasses = {
    default: 'text-muted-foreground hover:text-foreground',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    overlay: 'text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm',
  };

  return (
    <motion.div whileTap={{ scale: 0.95 }} className="inline-flex">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className={cn(
          'gap-1.5 px-2.5 py-1.5 h-auto font-medium text-sm rounded-lg transition-colors',
          variantClasses[variant],
          className
        )}
        aria-label={ariaLabel}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={cn(!showLabelOnMobile && 'hidden sm:inline')}>
          {displayLabel}
        </span>
      </Button>
    </motion.div>
  );
}
