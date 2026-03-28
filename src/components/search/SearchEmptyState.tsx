import { Search } from 'lucide-react';
import { CommandEmpty } from '@/components/ui/command';
import { quickActions, getColorClass } from './searchTypes';

interface SearchEmptyStateProps {
  query: string;
  onQuickAction: (action: typeof quickActions[number]) => void;
}

export function SearchEmptyState({ query, onQuickAction }: SearchEmptyStateProps) {
  return (
    <CommandEmpty>
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Search className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="font-medium">Nenhum resultado para &quot;{query}&quot;</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tente buscar por nome, email, empresa ou título
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onQuickAction(action)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${getColorClass(action.color)} hover:opacity-80`}
              >
                <Icon className="w-3 h-3" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </CommandEmpty>
  );
}

export function SearchLoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Buscando...</p>
      </div>
    </div>
  );
}
