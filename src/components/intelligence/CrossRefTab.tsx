import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Search, Loader2, Download, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { DataGrid } from '@/components/intel/DataGrid';
import { MetricMono } from '@/components/intel/MetricMono';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelSkeleton } from '@/components/intel/IntelSkeleton';
import { IntelErrorState } from '@/components/intel/IntelErrorState';
import { IntelEmptyState } from '@/components/intel/IntelEmptyState';
import { TemporalHeatmap } from '@/components/intel/TemporalHeatmap';
import { useCrossReference } from '@/hooks/useCrossReference';
import { queryExternalData } from '@/lib/externalData';
import { downloadCsv } from '@/lib/intelExport';
import { format } from 'date-fns';

interface MetaRow {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
}

const COMPARE_FIELDS = [
  { key: 'created_at', label: 'CRIADO_EM', format: (v: unknown) => v ? format(new Date(String(v)), 'dd/MM/yyyy') : '—' },
  { key: 'updated_at', label: 'ATUALIZADO', format: (v: unknown) => v ? format(new Date(String(v)), 'dd/MM/yyyy') : '—' },
  { key: 'relationship_score', label: 'SCORE', format: (v: unknown) => v != null ? String(v) : '—' },
  { key: 'industry', label: 'INDUSTRY', format: (v: unknown) => v ? String(v) : '—' },
  { key: 'role', label: 'ROLE', format: (v: unknown) => v ? String(v) : '—' },
  { key: 'email', label: 'EMAIL', format: (v: unknown) => v ? String(v) : '—' },
  { key: 'phone', label: 'PHONE', format: (v: unknown) => v ? String(v) : '—' },
];

interface Picked { id: string; name: string; }

export const CrossRefTab = () => {
  const [type, setType] = useState<'contact' | 'company'>('contact');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Picked[]>([]);
  const [searching, setSearching] = useState(false);
  const [metaRows, setMetaRows] = useState<MetaRow[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const { data, isLoading, error, refetch } = useCrossReference({
    entityIds: picked.map((p) => p.id),
    entityType: type,
  });

  const peakDay = useMemo(() => {
    if (!data?.temporalOverlap?.length) return null;
    return [...data.temporalOverlap].sort((a, b) => b.count - a.count)[0];
  }, [data]);

  // Busca metadata de cada entidade selecionada para comparação lado-a-lado.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (picked.length < 2) { setMetaRows([]); return; }
      setLoadingMeta(true);
      try {
        const table = type === 'contact' ? 'contacts' : 'companies';
        const rows = await Promise.all(
          picked.map(async (p) => {
            const { data: r } = await queryExternalData<Record<string, unknown>>({
              table,
              select: '*',
              filters: [{ type: 'eq', column: 'id', value: p.id }],
              range: { from: 0, to: 0 },
            });
            return { id: p.id, name: p.name, metadata: r?.[0] || {} };
          })
        );
        if (!cancelled) setMetaRows(rows);
      } catch {
        if (!cancelled) setMetaRows([]);
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [picked, type]);

  const compareFields = useMemo(() => {
    if (metaRows.length < 2) return [];
    return COMPARE_FIELDS.filter((f) =>
      metaRows.some((m) => m.metadata[f.key] !== undefined && m.metadata[f.key] !== null && m.metadata[f.key] !== '')
    );
  }, [metaRows]);

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
    } catch {
      toast.error('Falha na busca.');
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

  const exportData = () => {
    if (!data) return;
    downloadCsv(
      data.sharedInteractions.map((i) => ({ ...i })),
      `crossref-interacoes-${Date.now()}`
    );
    toast.success('CSV exportado com sucesso.');
  };

  return (
    <div className="space-y-3">
      <SectionFrame title="CROSS_REFERENCE_BUILDER" meta={`${picked.length}/3 SELECTED`}>
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Tipo de entidade">
          {(['contact', 'company'] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? 'default' : 'outline'}
              onClick={() => { setType(t); setPicked([]); }}
              className="intel-mono text-[10px] uppercase h-8"
              aria-pressed={type === t}
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
                <button
                  onClick={() => setPicked(picked.filter((x) => x.id !== p.id))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${p.name}`}
                >
                  <X className="h-3 w-3" aria-hidden />
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
              aria-label="Buscar entidade"
            />
            <Button size="sm" onClick={doSearch} disabled={searching} className="h-8" aria-label="Buscar">
              {searching ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Search className="h-3 w-3" aria-hidden />}
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
                aria-label={`Adicionar ${r.name}`}
              >
                <span className="text-foreground">{r.name}</span>
                <Plus className="h-3 w-3 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </SectionFrame>

      {picked.length >= 2 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="intel-card px-3 py-2">
              <MetricMono label="SHARED_INT" value={isLoading ? '…' : (data?.sharedInteractions.length ?? '—')} />
            </div>
            <div className="intel-card px-3 py-2">
              <MetricMono label="SHARED_DEALS" value={isLoading ? '…' : (data?.sharedDeals.length ?? '—')} />
            </div>
            <div className="intel-card px-3 py-2">
              <MetricMono label="OVERLAP_DAYS" value={isLoading ? '…' : (data?.temporalOverlap.length ?? '—')} />
            </div>
          </div>

          {error && <IntelErrorState onRetry={() => refetch()} />}

          <SectionFrame
            title="TEMPORAL_OVERLAP"
            meta="30D"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={exportData}
                disabled={!data?.sharedInteractions.length}
                className="h-7 intel-mono text-[10px] gap-1.5"
                aria-label="Exportar CSV"
              >
                <Download className="h-3 w-3" aria-hidden /> CSV
              </Button>
            }
          >
            {isLoading ? (
              <IntelSkeleton lines={4} label="COMPUTING_OVERLAP" />
            ) : (
              <>
                <TemporalHeatmap data={data?.temporalOverlap || []} days={30} />
                {peakDay && (
                  <p className="intel-mono text-[11px] text-muted-foreground mt-3">
                    PICO: <span className="text-[hsl(var(--intel-accent))]">{format(new Date(peakDay.date), 'dd/MM/yyyy')}</span> com {peakDay.count} interaç{peakDay.count === 1 ? 'ão' : 'ões'} compartilhada{peakDay.count === 1 ? '' : 's'}.
                  </p>
                )}
              </>
            )}
          </SectionFrame>

          <SectionFrame title="SHARED_INTERACTIONS" count={data?.sharedInteractions.length} meta={isLoading ? 'LOADING…' : 'OK'}>
            {isLoading ? (
              <IntelSkeleton lines={5} />
            ) : (
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
            )}
          </SectionFrame>

          <SectionFrame title="SHARED_DEALS" count={data?.sharedDeals.length}>
            {isLoading ? (
              <IntelSkeleton lines={4} />
            ) : (
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
            )}
          </SectionFrame>
        </>
      )}

      {picked.length < 2 && (
        <IntelEmptyState
          icon={GitCompare}
          title="SELECT_AT_LEAST_2_ENTITIES"
          description="Adicione 2 ou 3 entidades acima para cruzar interações, deals compartilhados e comparar metadata lado a lado."
        />
      )}
    </div>
  );
};
