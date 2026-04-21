import React from 'react';
import { Smile, Meh, Frown, Sparkles, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SentimentoFilter } from '@/hooks/useInteractionsAdvancedFilter';

interface Props {
  value: SentimentoFilter | undefined;
  onChange: (value: SentimentoFilter | undefined) => void;
  counts?: Partial<Record<SentimentoFilter, number>>;
}

interface ItemConfig {
  key: SentimentoFilter | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
}

const ITEMS: ItemConfig[] = [
  { key: 'all',      label: 'Todos',    icon: Filter,    activeClass: 'border-primary bg-primary/10 text-foreground' },
  { key: 'positive', label: 'Positivo', icon: Smile,     activeClass: 'border-success bg-success/10 text-success' },
  { key: 'neutral',  label: 'Neutro',   icon: Meh,       activeClass: 'border-warning bg-warning/10 text-warning' },
  { key: 'negative', label: 'Negativo', icon: Frown,     activeClass: 'border-destructive bg-destructive/10 text-destructive' },
  { key: 'mixed',    label: 'Misto',    icon: Sparkles,  activeClass: 'border-accent bg-accent/10 text-accent-foreground' },
];

export const SentimentQuickFilter = React.memo(function SentimentQuickFilter({ value, onChange, counts }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const moveFocus = React.useCallback((dir: 1 | -1) => {
    const root = containerRef.current;
    if (!root) return;
    const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[role="radio"]'));
    if (buttons.length === 0) return;
    const idx = buttons.findIndex((b) => b === document.activeElement);
    const nextIdx = (idx + dir + buttons.length) % buttons.length;
    buttons[nextIdx]?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); moveFocus(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); moveFocus(-1); }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Filtrar por sentimento"
        onKeyDown={handleKeyDown}
        className="flex flex-wrap items-center gap-1.5"
      >
        {ITEMS.map(({ key, label, icon: Icon, activeClass }) => {
          const isAll = key === 'all';
          const active = isAll ? !value : value === key;
          const count = !isAll && counts ? counts[key as SentimentoFilter] : undefined;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={label}
                  onClick={() => onChange(isAll ? undefined : (key as SentimentoFilter))}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border text-xs font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    active
                      ? activeClass
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span className={cn(
                      'ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-semibold',
                      active ? 'bg-foreground/10' : 'bg-muted',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {isAll ? 'Mostrar todos os sentimentos' : `Filtrar por ${label.toLowerCase()}`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
