import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SectionFrame } from './SectionFrame';
import { IntelBadge } from './IntelBadge';
import { IntelEmptyState } from './IntelEmptyState';
import { CalendarDays } from 'lucide-react';
import type { Entity360TimelineEvent } from '@/hooks/useEntity360';

interface EntityMonthlyTimelineProps {
  events: Entity360TimelineEvent[];
  onClose?: () => void;
}

interface MonthGroup {
  key: string;
  label: string;
  events: Entity360TimelineEvent[];
}

/**
 * Visualização vertical agrupada por mês (estilo "log temporal") para o Entity 360.
 * Renderiza interações + deals + eventos de people-intelligence numa faixa única.
 */
export const EntityMonthlyTimeline = ({ events, onClose }: EntityMonthlyTimelineProps) => {
  const groups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();
    [...events]
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
      .forEach((ev) => {
        let date: Date;
        try {
          date = parseISO(ev.occurred_at);
          if (Number.isNaN(date.getTime())) date = new Date(ev.occurred_at);
        } catch {
          date = new Date();
        }
        const key = format(date, 'yyyy-MM');
        const label = format(date, "MMMM yyyy", { locale: ptBR }).toUpperCase();
        if (!map.has(key)) map.set(key, { key, label, events: [] });
        map.get(key)!.events.push(ev);
      });
    return Array.from(map.values());
  }, [events]);

  return (
    <SectionFrame
      title="TIMELINE_MENSAL"
      meta={`${events.length} EVENTS · ${groups.length} MESES`}
      cornerFrame
      actions={
        onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="intel-mono text-[10px] text-muted-foreground hover:text-foreground"
            aria-label="Fechar timeline"
          >
            ✕ FECHAR
          </button>
        ) : undefined
      }
    >
      {groups.length === 0 ? (
        <IntelEmptyState
          icon={CalendarDays}
          title="NO_EVENTS"
          description="Sem eventos cronológicos para exibir nesta entidade."
        />
      ) : (
        <ol className="relative pl-4 max-h-[520px] overflow-y-auto" aria-label="Linha do tempo">
          <span
            className="absolute left-1 top-0 bottom-0 w-px bg-[hsl(var(--intel-border))]"
            aria-hidden
          />
          {groups.map((g) => (
            <li key={g.key} className="mb-3">
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[hsl(var(--intel-surface-1))] z-[1] py-1">
                <span
                  className="absolute -left-0.5 h-2 w-2 rounded-full bg-[hsl(var(--intel-accent))]"
                  aria-hidden
                />
                <span className="intel-eyebrow text-foreground">{g.label}</span>
                <span className="intel-mono text-[10px] text-muted-foreground">
                  [{g.events.length.toString().padStart(2, '0')}]
                </span>
              </div>
              <ul className="space-y-1.5">
                {g.events.map((ev) => {
                  let when = '—';
                  try {
                    when = format(parseISO(ev.occurred_at), 'dd/MM HH:mm');
                  } catch { /* ignore */ }
                  return (
                    <li
                      key={ev.id}
                      className="intel-card intel-card-hover px-2 py-1.5 text-xs flex gap-2"
                    >
                      <span className="intel-mono text-muted-foreground w-20 shrink-0">{when}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <IntelBadge severity="info">{ev.kind}</IntelBadge>
                          <span className="text-foreground truncate">{ev.title}</span>
                        </div>
                        {ev.detail && (
                          <p className="text-muted-foreground truncate mt-0.5">{ev.detail}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </SectionFrame>
  );
};
