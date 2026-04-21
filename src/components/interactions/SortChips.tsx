import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Sparkles, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SortKey } from '@/lib/sortInteractions';

interface Props {
  value: SortKey;
  onChange: (value: SortKey) => void;
  hasQuery: boolean;
}

interface SortConfigItem {
  key: SortKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
  requiresQuery?: boolean;
}

const SORT_CONFIG: SortConfigItem[] = [
  { key: 'recent', label: 'Mais recentes', icon: ArrowDown, shortcut: 'R' },
  { key: 'oldest', label: 'Mais antigas', icon: ArrowUp, shortcut: 'O' },
  { key: 'relevance', label: 'Melhor correspondência', icon: Sparkles, shortcut: 'M', requiresQuery: true },
  { key: 'entity', label: 'Por pessoa/empresa', icon: Users, shortcut: 'P' },
];

export const SortChips = React.memo(function SortChips({ value, onChange, hasQuery }: Props) {
  const effective: SortKey = value === 'relevance' && !hasQuery ? 'recent' : value;
  const [altDown, setAltDown] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltDown(true);
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const k = e.key.toLowerCase();
      const item = SORT_CONFIG.find(i => i.shortcut.toLowerCase() === k);
      if (!item) return;
      if (item.requiresQuery && !hasQuery) return;
      e.preventDefault();
      if (effective !== item.key) {
        onChange(item.key);
        toast.message(`Ordenação: ${item.label}`, { duration: 1500 });
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') setAltDown(false);
    };
    const onBlur = () => setAltDown(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [effective, hasQuery, onChange]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
        role="group"
        aria-label="Ordenar lista"
      >
        {SORT_CONFIG.map(({ key, label, icon: Icon, shortcut, requiresQuery }) => {
          const active = effective === key;
          const disabled = !!requiresQuery && !hasQuery;
          const tooltip = disabled
            ? 'Disponível ao buscar por palavra-chave'
            : `${label} · Alt+${shortcut}`;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={active}
                  aria-label={label}
                  onClick={() => {
                    if (disabled || active) return;
                    onChange(key);
                  }}
                  className={cn(
                    'relative inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium transition-colors',
                    active
                      ? 'border border-primary bg-primary/10 text-foreground'
                      : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                    disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                  {altDown && !disabled && (
                    <kbd className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded bg-foreground text-background text-[9px] font-mono font-semibold flex items-center justify-center pointer-events-none">
                      {shortcut}
                    </kbd>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{tooltip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
