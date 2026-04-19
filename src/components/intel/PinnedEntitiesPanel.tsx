import { Star, X } from 'lucide-react';
import { SectionFrame } from './SectionFrame';
import { IntelEmptyState } from './IntelEmptyState';
import { IntelBadge } from './IntelBadge';
import { useEntityBookmarks, type EntityBookmark } from '@/hooks/useEntityBookmarks';

interface PinnedEntitiesPanelProps {
  onOpen: (b: EntityBookmark) => void;
}

export const PinnedEntitiesPanel = ({ onOpen }: PinnedEntitiesPanelProps) => {
  const { items, remove, max } = useEntityBookmarks();

  return (
    <SectionFrame title="PINNED" meta={`${items.length}/${max}`}>
      {items.length === 0 ? (
        <IntelEmptyState
          icon={Star}
          title="EMPTY"
          description="Marque entidades com ★ para acessá-las rapidamente aqui."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((b) => (
            <li key={`${b.type}-${b.id}`} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpen(b)}
                className="flex-1 text-left intel-card intel-card-hover px-2 py-1 text-[11px] flex items-center gap-1.5"
                aria-label={`Abrir ${b.name}`}
              >
                <IntelBadge severity="info">{b.type.toUpperCase()}</IntelBadge>
                <span className="text-foreground truncate flex-1">{b.name}</span>
              </button>
              <button
                type="button"
                onClick={() => remove(b.type, b.id)}
                className="p-1 text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${b.name} dos bookmarks`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
};
