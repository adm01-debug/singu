import { Grid3X3, List, Table2, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 text-xs font-medium', className)}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Layout
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3 space-y-3">
        {/* View Mode */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Visualização
          </span>
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
                    'h-7 px-2.5 gap-1.5 text-xs font-medium transition-colors flex-1',
                    !isActive && 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mode.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Grid Columns - only show when grid mode */}
        {value === 'grid' && onGridColumnsChange && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Colunas
            </span>
            <div className="flex items-center gap-1">
              {columnOptions.map((cols) => {
                const isActive = gridColumns === cols;
                return (
                  <button
                    key={cols}
                    onClick={() => onGridColumnsChange(cols)}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                    title={`${cols} colunas`}
                  >
                    <ColumnIcon cols={cols} active={isActive} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
