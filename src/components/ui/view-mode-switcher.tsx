import { Grid3X3, List, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'table';

interface ViewModeSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

const modes = [
  { value: 'grid' as const, icon: Grid3X3, label: 'Grid' },
  { value: 'list' as const, icon: List, label: 'Lista' },
  { value: 'table' as const, icon: Table2, label: 'Tabela' },
];

export function ViewModeSwitcher({ value, onChange, className }: ViewModeSwitcherProps) {
  return (
    <div
      className={cn('flex items-center gap-0.5 bg-secondary/60 rounded-lg p-1', className)}
      role="group"
      aria-label="Modo de visualização"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        return (
          <Button
            key={mode.value}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onChange(mode.value)}
            className={cn(
              'h-7 px-2.5 gap-1.5 text-xs font-medium transition-colors',
              !isActive && 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={`Visualização em ${mode.label}`}
            aria-pressed={isActive}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{mode.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
