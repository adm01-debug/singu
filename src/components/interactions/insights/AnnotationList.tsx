import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ANNOTATION_CATEGORIES } from './annotationCategories';
import type { SentimentAnnotation, useSentimentAnnotations } from '@/hooks/useSentimentAnnotations';
import { cn } from '@/lib/utils';

interface Props {
  api: ReturnType<typeof useSentimentAnnotations>;
  onEdit: (a: SentimentAnnotation) => void;
}

function formatWeek(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AnnotationList({ api, onEdit }: Props) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const items = api.list.data ?? [];

  if (items.length === 0) return null;

  return (
    <div className="rounded-md border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Anotações <span className="text-muted-foreground tabular-nums">({items.length})</span>
        </span>
        <span className="text-[10px] text-muted-foreground">clique para {open ? 'recolher' : 'expandir'}</span>
      </button>
      {open && (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto">
          {items.map((a) => {
            const meta = ANNOTATION_CATEGORIES[a.category];
            const Icon = meta.icon;
            const canEdit = !!user && (a.created_by === user.id || isAdmin);
            return (
              <li key={a.id} className="px-3 py-2 flex items-start gap-2">
                <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: meta.color }} aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn('text-[10px] gap-1', meta.badgeClass)}>{meta.label}</Badge>
                    <span className="text-[10px] text-muted-foreground tabular-nums">Sem. {formatWeek(a.week_start)}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground mt-1 break-words">{a.title}</p>
                  {a.description && <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{a.description}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">criado em {formatDateTime(a.created_at)}</p>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => onEdit(a)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Excluir esta anotação?')) api.remove.mutate(a.id);
                      }}
                      title="Excluir"
                      disabled={api.remove.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
