import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, ChevronRight, ArrowLeft, Copy, ExternalLink, User } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { EntityCard } from '@/components/intel/EntityCard';
import { DataGrid } from '@/components/intel/DataGrid';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelSkeleton } from '@/components/intel/IntelSkeleton';
import { IntelErrorState } from '@/components/intel/IntelErrorState';
import { IntelEmptyState } from '@/components/intel/IntelEmptyState';
import { useEntity360, type Entity360Type } from '@/hooks/useEntity360';
import { queryExternalData } from '@/lib/externalData';
import { format } from 'date-fns';

const CRM_PATH: Record<Entity360Type, string> = {
  contact: '/contatos',
  company: '/empresas',
  deal: '/pipeline',
};

interface Crumb { type: Entity360Type; id: string; name: string; }

export const Entity360Tab = () => {
  const [type, setType] = useState<Entity360Type>('contact');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const [history, setHistory] = useState<Crumb[]>([]);
  const [searching, setSearching] = useState(false);

  const current = history[history.length - 1] || null;
  const { data, isLoading, error, refetch } = useEntity360(current?.type ?? null, current?.id ?? null);

  const doSearch = useCallback(async () => {
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
      const mapped = (rows || []).map((r) => ({
        id: String(r.id),
        name: String(r[nameCol] || 'Sem nome'),
      }));
      setResults(mapped);
      if (mapped.length === 0) toast.info('Nenhum resultado para a busca.');
    } catch {
      toast.error('Falha ao buscar entidades.');
    } finally {
      setSearching(false);
    }
  }, [search, type]);

  const open = (c: Crumb) => {
    setHistory((h) => [...h, c]);
    setResults([]);
  };

  const back = () => setHistory((h) => h.slice(0, -1));
  const reset = () => { setHistory([]); setResults([]); };

  return (
    <div className="space-y-3">
      <SectionFrame title="ENTITY_LOOKUP" meta="QUERY">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1" role="group" aria-label="Tipo de entidade">
            {(['contact', 'company', 'deal'] as Entity360Type[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={type === t ? 'default' : 'outline'}
                onClick={() => { setType(t); reset(); }}
                className="intel-mono text-[10px] uppercase h-8"
                aria-pressed={type === t}
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
              aria-label="Termo de busca"
            />
            <Button size="sm" onClick={doSearch} disabled={searching} className="h-8" aria-label="Buscar">
              {searching ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Search className="h-3 w-3" aria-hidden />}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((r) => (
              <EntityCard
                key={r.id}
                type={type.toUpperCase()}
                id={r.id}
                title={r.name}
                onClick={() => open({ type, id: r.id, name: r.name })}
              />
            ))}
          </div>
        )}

        {history.length > 0 && (
          <nav aria-label="Trilha de navegação" className="mt-3 flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="ghost" onClick={back} className="h-7 intel-mono text-[10px]" aria-label="Voltar">
              <ArrowLeft className="h-3 w-3 mr-1" aria-hidden /> VOLTAR
            </Button>
            {history.map((h, i) => (
              <span key={`${h.id}-${i}`} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden />}
                <span className="intel-mono text-[10px] text-foreground truncate max-w-[140px]">
                  {h.type.toUpperCase()}/{h.name}
                </span>
              </span>
            ))}
          </nav>
        )}
      </SectionFrame>

      {current && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <SectionFrame title="METADATA" meta={isLoading ? 'LOADING…' : error ? 'ERROR' : 'OK'} className="lg:col-span-1">
            {isLoading && <IntelSkeleton lines={6} label="FETCHING_META" />}
            {!isLoading && error && <IntelErrorState onRetry={() => refetch()} />}
            {!isLoading && !error && (
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
            {isLoading ? (
              <IntelSkeleton lines={5} label="FETCHING_EVENTS" />
            ) : (
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
            )}
          </SectionFrame>

          <SectionFrame title="RELATED_ENTITIES" count={data?.related.length}>
            {isLoading ? (
              <IntelSkeleton lines={4} label="FETCHING_RELATIONS" />
            ) : (
              <DataGrid
                columns={[
                  { key: 'type', label: 'TYPE', mono: true, width: '80px' },
                  { key: 'name', label: 'NAME' },
                  { key: 'meta', label: 'META', mono: true },
                ]}
                rows={(data?.related || []) as unknown as Array<Record<string, unknown>>}
                getRowKey={(r) => `${r.type}-${r.id}`}
                onRowClick={(r) => {
                  const t = String(r.type).toLowerCase();
                  if (t === 'contact' || t === 'company' || t === 'deal') {
                    open({ type: t as Entity360Type, id: String(r.id), name: String(r.name) });
                  }
                }}
                emptyMessage="NO_RELATIONS"
              />
            )}
          </SectionFrame>
        </div>
      )}
    </div>
  );
};
