import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Search, Loader2 } from 'lucide-react';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { DataGrid } from '@/components/intel/DataGrid';
import { MetricMono } from '@/components/intel/MetricMono';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { useCrossReference } from '@/hooks/useCrossReference';
import { queryExternalData } from '@/lib/externalData';
import { format } from 'date-fns';

interface Picked { id: string; name: string; }

export const CrossRefTab = () => {
  const [type, setType] = useState<'contact' | 'company'>('contact');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Picked[]>([]);
  const [searching, setSearching] = useState(false);

  const { data, isLoading } = useCrossReference({
    entityIds: picked.map((p) => p.id),
    entityType: type,
  });

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const table = type === 'contact' ? 'contacts' : 'companies';
      const nameCol = type === 'contact' ? 'full_name' : 'name';
      const { data: rows } = await queryExternalData<Record<string, unknown>>({
        table,
        select: `id, ${nameCol}`,
        search: { term: search, columns: [nameCol] },
        range: { from: 0, to: 9 },
      });
      setResults((rows || []).map((r) => ({ id: String(r.id), name: String(r[nameCol] || 'Sem nome') })));
    } finally {
      setSearching(false);
    }
  };

  const add = (p: Picked) => {
    if (picked.length >= 3 || picked.some((x) => x.id === p.id)) return;
    setPicked([...picked, p]);
    setResults([]);
    setSearch('');
  };

  return (
    <div className="space-y-3">
      <SectionFrame title="CROSS_REFERENCE_BUILDER" meta={`${picked.length}/3 SELECTED`}>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['contact', 'company'] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? 'default' : 'outline'}
              onClick={() => { setType(t); setPicked([]); }}
              className="intel-mono text-[10px] uppercase h-8"
            >
              {t}
            </Button>
          ))}
        </div>

        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {picked.map((p) => (
              <span key={p.id} className="intel-card px-2 py-1 text-xs flex items-center gap-1.5">
                <IntelBadge severity="info">{type.toUpperCase()}</IntelBadge>
                <span className="text-foreground">{p.name}</span>
                <button onClick={() => setPicked(picked.filter((x) => x.id !== p.id))} className="text-muted-foreground hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {picked.length < 3 && (
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder={`Adicionar ${type}…`}
              className="intel-mono text-xs h-8"
            />
            <Button size="sm" onClick={doSearch} disabled={searching} className="h-8">
              {searching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-2 space-y-1">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => add(r)}
                className="w-full text-left intel-card intel-card-hover px-2 py-1.5 text-xs flex items-center justify-between"
              >
                <span className="text-foreground">{r.name}</span>
                <Plus className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </SectionFrame>

      {picked.length >= 2 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="intel-card px-3 py-2">
              <MetricMono label="SHARED_INT" value={data?.sharedInteractions.length ?? '—'} />
            </div>
            <div className="intel-card px-3 py-2">
              <MetricMono label="SHARED_DEALS" value={data?.sharedDeals.length ?? '—'} />
            </div>
            <div className="intel-card px-3 py-2">
              <MetricMono label="OVERLAP_DAYS" value={data?.temporalOverlap.length ?? '—'} />
            </div>
          </div>

          <SectionFrame title="SHARED_INTERACTIONS" count={data?.sharedInteractions.length} meta={isLoading ? 'LOADING…' : 'OK'}>
            <DataGrid
              columns={[
                {
                  key: 'occurred_at', label: 'TIMESTAMP', mono: true, width: '140px',
                  render: (r) => format(new Date(String(r.occurred_at)), 'dd/MM/yy HH:mm'),
                },
                { key: 'channel', label: 'CHANNEL', mono: true, width: '100px' },
                { key: 'type', label: 'TYPE', mono: true },
              ]}
              rows={(data?.sharedInteractions || []) as unknown as Array<Record<string, unknown>>}
              getRowKey={(r) => String(r.id)}
              emptyMessage="NO_SHARED_INTERACTIONS"
            />
          </SectionFrame>

          <SectionFrame title="SHARED_DEALS" count={data?.sharedDeals.length}>
            <DataGrid
              columns={[
                { key: 'title', label: 'TITLE' },
                { key: 'stage', label: 'STAGE', mono: true, width: '120px' },
                {
                  key: 'value', label: 'VALUE', mono: true, width: '120px',
                  render: (r) => `R$ ${Number(r.value).toLocaleString('pt-BR')}`,
                },
              ]}
              rows={(data?.sharedDeals || []) as unknown as Array<Record<string, unknown>>}
              getRowKey={(r) => String(r.id)}
              emptyMessage="NO_SHARED_DEALS"
            />
          </SectionFrame>
        </>
      )}

      {picked.length < 2 && (
        <div className="intel-card p-8 text-center intel-mono text-xs text-muted-foreground">
          ── SELECT_AT_LEAST_2_ENTITIES_TO_CROSS_REFERENCE ──
        </div>
      )}
    </div>
  );
};
