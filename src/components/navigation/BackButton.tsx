import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigationStack } from '@/contexts/NavigationStackContext';

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
 * - Includes accessible label and keyboard support
 * - Provides contextual aria-label with destination info
 */
export function BackButton({
  to,
  label = 'Voltar',
  variant = 'ghost',
  className,
  showLabelOnMobile = false,
}: BackButtonProps) {
  const { goBack, previousPath } = useNavigationStack();

  const handleBack = () => {
    if (to) {
      // Use navigation stack's navigate to maintain stack integrity
      goBack(to);
    } else {
      goBack('/');
    }
  };

  // Build contextual aria-label
  const destinationHint = to || previousPath;
  const contextualLabel = destinationHint
    ? `${label} para ${destinationHint.replace(/^\//, '').split('/')[0] || 'início'}`
    : label;

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
        aria-label={contextualLabel}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={cn(!showLabelOnMobile && 'hidden sm:inline')}>
          {label}
        </span>
      </Button>
    </motion.div>
  );
}
