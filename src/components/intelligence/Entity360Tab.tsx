import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { EntityCard } from '@/components/intel/EntityCard';
import { DataGrid } from '@/components/intel/DataGrid';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { useEntity360, type Entity360Type } from '@/hooks/useEntity360';
import { queryExternalData } from '@/lib/externalData';
import { format } from 'date-fns';

export const Entity360Tab = () => {
  const [type, setType] = useState<Entity360Type>('contact');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; sub?: string }>>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const { data, isLoading } = useEntity360(selectedId ? type : null, selectedId);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const table = type === 'contact' ? 'contacts' : type === 'company' ? 'companies' : 'deals';
      const nameCol = type === 'contact' ? 'full_name' : type === 'company' ? 'name' : 'title';
      const { data: rows } = await queryExternalData<Record<string, unknown>>({
        table,
        select: `id, ${nameCol}`,
        search: { term: search, columns: [nameCol] },
        range: { from: 0, to: 9 },
      });
      setResults(
        (rows || []).map((r) => ({
          id: String(r.id),
          name: String(r[nameCol] || 'Sem nome'),
        }))
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <SectionFrame title="ENTITY_LOOKUP" meta="QUERY">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {(['contact', 'company', 'deal'] as Entity360Type[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={type === t ? 'default' : 'outline'}
                onClick={() => { setType(t); setSelectedId(null); setResults([]); }}
                className="intel-mono text-[10px] uppercase h-8"
              >
                {t}
              </Button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Buscar por nome…"
              className="intel-mono text-xs h-8"
            />
            <Button size="sm" onClick={doSearch} disabled={searching} className="h-8">
              {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {results.length > 0 && !selectedId && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((r) => (
              <EntityCard
                key={r.id}
                type={type.toUpperCase()}
                id={r.id}
                title={r.name}
                onClick={() => setSelectedId(r.id)}
              />
            ))}
          </div>
        )}
      </SectionFrame>

      {selectedId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <SectionFrame title="METADATA" meta={isLoading ? 'LOADING…' : 'OK'} className="lg:col-span-1">
            {isLoading ? (
              <div className="text-xs text-muted-foreground intel-mono">FETCHING…</div>
            ) : (
              <dl className="space-y-1.5 text-xs">
                {Object.entries(data?.metadata || {}).slice(0, 18).map(([k, v]) => (
                  <div key={k} className="flex gap-2 border-b border-border/30 pb-1">
                    <dt className="intel-eyebrow shrink-0 w-28 truncate">{k}</dt>
                    <dd className="intel-mono text-foreground truncate flex-1">
                      {v === null || v === undefined || v === '' ? '—' : String(v).slice(0, 50)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionFrame>

          <SectionFrame
            title="TIMELINE"
            meta={`${data?.timeline.length || 0} EVENTS`}
            count={data?.timeline.length}
            className="lg:col-span-1"
          >
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {(data?.timeline || []).map((ev) => (
                <div key={ev.id} className="flex gap-2 text-xs border-l-2 border-[hsl(var(--intel-accent))] pl-2 py-1">
                  <span className="intel-mono text-muted-foreground w-20 shrink-0">
                    {format(new Date(ev.occurred_at), 'dd/MM HH:mm')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <IntelBadge severity="info">{ev.kind}</IntelBadge>
                      <span className="text-foreground truncate">{ev.title}</span>
                    </div>
                    {ev.detail && <p className="text-muted-foreground truncate mt-0.5">{ev.detail}</p>}
                  </div>
                </div>
              ))}
              {(!data?.timeline || data.timeline.length === 0) && (
                <div className="text-center py-6 intel-mono text-xs text-muted-foreground">── NO_EVENTS ──</div>
              )}
            </div>
          </SectionFrame>

          <SectionFrame title="RELATED_ENTITIES" count={data?.related.length}>
            <DataGrid
              columns={[
                { key: 'type', label: 'TYPE', mono: true, width: '70px' },
                { key: 'name', label: 'NAME' },
                { key: 'meta', label: 'META', mono: true },
              ]}
              rows={(data?.related || []) as unknown as Array<Record<string, unknown>>}
              getRowKey={(r) => String(r.id)}
              emptyMessage="NO_RELATIONS"
            />
          </SectionFrame>
        </div>
      )}
    </div>
  );
};
