import { Grid3X3, List, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'table';
export type GridColumns = 2 | 3 | 4 | 5 | 6;

interface ViewModeSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  gridColumns?: GridColumns;
  onGridColumnsChange?: (cols: GridColumns) => void;
  className?: string;
}

const modes = [
  { value: 'grid' as const, icon: Grid3X3, label: 'Grid' },
  { value: 'list' as const, icon: List, label: 'Lista' },
  { value: 'table' as const, icon: Table2, label: 'Tabela' },
];

const columnOptions: GridColumns[] = [2, 3, 4, 5, 6];

function ColumnIcon({ cols, active }: { cols: number; active: boolean }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-[3px] h-3.5 rounded-[1px] transition-colors',
            active ? 'bg-primary-foreground' : 'bg-muted-foreground/60'
          )}
        />
      ))}
    </div>
  );
}

export function ViewModeSwitcher({ value, onChange, gridColumns = 3, onGridColumnsChange, className }: ViewModeSwitcherProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* View Mode Buttons */}
      <div className="flex items-center gap-0.5 bg-secondary/60 rounded-lg p-1">
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
            >
              <Icon className="w-3.5 h-3.5" />
              {mode.label}
            </Button>
          );
        })}
      </div>

      {/* Grid Columns - inline, only when grid mode */}
      {value === 'grid' && onGridColumnsChange && (
        <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-1">
          {columnOptions.map((cols) => {
            const isActive = gridColumns === cols;
            return (
              <button
                key={cols}
                onClick={() => onGridColumnsChange(cols)}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
                title={`${cols} colunas`}
              >
                <ColumnIcon cols={cols} active={isActive} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
