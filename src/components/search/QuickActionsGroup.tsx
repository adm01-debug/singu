import {
  ArrowRight,
  Clock,
  Command,
  Zap,
} from 'lucide-react';
import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { RecentItem } from './searchTypes';
import { quickActions, navigationItems, getTypeIcon, getColorClass } from './searchTypes';

interface QuickActionsGroupProps {
  filteredQuickActions: typeof quickActions;
  filteredRecent: RecentItem[];
  filteredNavigation: typeof navigationItems;
  currentPathname: string;
  onQuickAction: (action: typeof quickActions[number]) => void;
  onRecentSelect: (item: RecentItem) => void;
  onNavigate: (path: string, label: string) => void;
}

export function QuickActionsGroup({
  filteredQuickActions,
  filteredRecent,
  filteredNavigation,
  currentPathname,
  onQuickAction,
  onRecentSelect,
  onNavigate,
}: QuickActionsGroupProps) {
  return (
    <>
      {/* Quick Actions */}
      <CommandGroup heading={
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" />
          <span>Ações Rápidas</span>
        </div>
      }>
        {filteredQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <CommandItem
              key={action.id}
              onSelect={() => onQuickAction(action)}
              className="gap-3 py-3"
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${getColorClass(action.color)}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <CommandShortcut>Alt+{action.shortcut}</CommandShortcut>
            </CommandItem>
          );
        })}
      </CommandGroup>

      {/* Recent Items */}
      {filteredRecent.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading={
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Recentes</span>
            </div>
          }>
            {filteredRecent.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              return (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  onSelect={() => onRecentSelect(item)}
                  className="gap-3"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type === 'page' ? 'Página' : item.type}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        </>
      )}

      {/* Navigation */}
      {filteredNavigation.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading={
            <div className="flex items-center gap-2">
              <Command className="w-3 h-3" />
              <span>Navegação</span>
            </div>
          }>
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPathname === item.path;
              return (
                <CommandItem
                  key={item.path}
                  onSelect={() => onNavigate(item.path, item.label)}
                  className={`gap-3 ${isActive ? 'bg-primary/5' : ''}`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isActive ? 'text-primary' : ''}`}>{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="text-[10px]">Atual</Badge>
                  )}
                  <CommandShortcut>Alt+{item.key}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </>
      )}
    </>
  );
}
