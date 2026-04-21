import type { ProximoPasso, ProximoPassoPriority } from '@/lib/proximosPassos';
import type { NbaPriority, NbaSort } from '@/hooks/useProximosPassosFilters';

const PRIORITY_RANK: Record<ProximoPassoPriority, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
};

interface FilterOpts {
  priorities: NbaPriority[];
  channels: string[];
  sort: NbaSort;
}

/**
 * Filtra e reordena a lista de próximos passos.
 * - Default (`sugerido`) preserva a ordem original (vinda de `computeProximosPassos`).
 * - `prioridade`: alta → baixa (estável).
 * - `canal`: alfabético por canal (estável dentro do canal).
 */
export function filterAndSortPassos(
  passos: ProximoPasso[],
  { priorities, channels, sort }: FilterOpts,
): ProximoPasso[] {
  const filtered = passos.filter((p) => {
    if (priorities.length > 0 && !priorities.includes(p.priority as NbaPriority)) return false;
    if (channels.length > 0 && !channels.includes(p.channel)) return false;
    return true;
  });

  if (sort === 'sugerido') return filtered;

  // Decora com índice para sort estável
  const decorated = filtered.map((p, idx) => ({ p, idx }));

  if (sort === 'prioridade') {
    decorated.sort((a, b) => {
      const diff = (PRIORITY_RANK[b.p.priority] ?? 0) - (PRIORITY_RANK[a.p.priority] ?? 0);
      return diff !== 0 ? diff : a.idx - b.idx;
    });
  } else if (sort === 'canal') {
    decorated.sort((a, b) => {
      const diff = a.p.channel.localeCompare(b.p.channel);
      return diff !== 0 ? diff : a.idx - b.idx;
    });
  }

  return decorated.map((d) => d.p);
}
