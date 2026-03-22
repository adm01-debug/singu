import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /** Explicit path to navigate to. If omitted, uses browser history. */
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
 * - Falls back to browser history (navigate(-1))
 * - Falls back to "/" if there's no history
 * - Includes accessible label and keyboard support
 * - Animates with framer-motion tap feedback
 */
export function BackButton({
  to,
  label = 'Voltar',
  variant = 'ghost',
  className,
  showLabelOnMobile = false,
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

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
        aria-label={label}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={cn(!showLabelOnMobile && 'hidden sm:inline')}>
          {label}
        </span>
      </Button>
    </motion.div>
  );
}
