import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ExpandableCardProps {
  /** Always visible content */
  header: ReactNode;
  /** Content shown when expanded */
  expandedContent: ReactNode;
  /** Optional footer that's always visible */
  footer?: ReactNode;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Callback when expansion state changes */
  onExpandChange?: (expanded: boolean) => void;
  /** Custom expand button label */
  expandLabel?: string;
  /** Custom collapse button label */
  collapseLabel?: string;
  /** Hide expand/collapse button (for touch-only expansion) */
  hideButton?: boolean;
  /** Allow entire card to be clickable for expansion */
  clickToExpand?: boolean;
  /** Custom className */
  className?: string;
  /** Card variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Card padding */
  padding?: 'sm' | 'md' | 'lg';
  /** ARIA label for accessibility */
  ariaLabel?: string;
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-card border border-border shadow-sm',
  outline: 'bg-transparent border-2 border-border',
  ghost: 'bg-transparent border-none shadow-none',
};

export function ExpandableCard({
  header,
  expandedContent,
  footer,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onExpandChange,
  expandLabel = 'Ver mais',
  collapseLabel = 'Ver menos',
  hideButton = false,
  clickToExpand = false,
  className,
  variant = 'default',
  padding = 'md',
  ariaLabel,
}: ExpandableCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const prefersReducedMotion = useReducedMotion();
  
  // Use controlled or internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const toggleExpanded = () => {
    const newValue = !isExpanded;
    if (controlledExpanded === undefined) {
      setInternalExpanded(newValue);
    }
    onExpandChange?.(newValue);
  };

  const animationProps = prefersReducedMotion
    ? { initial: false as const, animate: { opacity: 1, height: 'auto' as const } }
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: 'auto' as const },
        exit: { opacity: 0, height: 0 },
        transition: { duration: 0.25, ease: 'easeInOut' as const },
      };

  return (
    <motion.div
      layout={!prefersReducedMotion}
      className={cn(
        'rounded-xl overflow-hidden',
        variantClasses[variant],
        paddingClasses[padding],
        clickToExpand && 'cursor-pointer',
        className
      )}
      onClick={clickToExpand ? toggleExpanded : undefined}
      role="region"
      aria-expanded={isExpanded}
      aria-label={ariaLabel}
    >
      {/* Header - Always visible */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">{header}</div>
        {!hideButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            className="flex-shrink-0 gap-1 h-8 px-2 text-muted-foreground hover:text-foreground"
            aria-label={isExpanded ? collapseLabel : expandLabel}
          >
            <span className="text-xs hidden sm:inline">
              {isExpanded ? collapseLabel : expandLabel}
            </span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            </motion.div>
          </Button>
        )}
      </div>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            {...animationProps}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-border/50 mt-4">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer - Always visible if provided */}
      {footer && (
        <div className="pt-3 mt-3 border-t border-border/50">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

// Progressive disclosure list for mobile
interface ProgressiveListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  initialCount?: number;
  incrementCount?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  className?: string;
  itemClassName?: string;
}

export function ProgressiveList<T>({
  items,
  renderItem,
  initialCount = 3,
  incrementCount = 5,
  showMoreLabel = 'Ver mais',
  showLessLabel = 'Ver menos',
  className,
  itemClassName,
}: ProgressiveListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const prefersReducedMotion = useReducedMotion();
  
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const isExpanded = visibleCount > initialCount;

  const showMore = () => {
    setVisibleCount(prev => Math.min(prev + incrementCount, items.length));
  };

  const showLess = () => {
    setVisibleCount(initialCount);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence initial={false}>
        {visibleItems.map((item, index) => (
          <motion.div
            key={index}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={itemClassName}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>

      {(hasMore || isExpanded) && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={hasMore ? showMore : showLess}
            className="gap-2 text-muted-foreground"
          >
            {hasMore ? (
              <>
                {showMoreLabel} ({items.length - visibleCount} restantes)
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              </>
            ) : (
              <>
                {showLessLabel}
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Collapsible section for grouping content
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon: Icon,
  badge,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span className="font-medium text-foreground">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
              {badge}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
