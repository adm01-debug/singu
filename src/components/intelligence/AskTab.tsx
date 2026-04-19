import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { useAskCrm } from '@/hooks/useAskCrm';
import { DataGrid } from '@/components/intel/DataGrid';

export const AskTab = () => {
  const { messages, loading, ask } = useAskCrm();
  const [input, setInput] = useState('');

  const submit = () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    ask(q);
  };

  const suggestions = [
    'Top 10 contatos por score de relacionamento',
    'Quais empresas têm deals abertos acima de 100k?',
    'Quantas interações tive nos últimos 7 dias?',
    'Mostre os 5 deals mais antigos no pipeline',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 h-[calc(100vh-260px)] min-h-[480px]">
      <SectionFrame title="QUERY_CONSOLE" meta="NL→SQL" className="flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center intel-mono text-xs text-muted-foreground py-12">
              ── AWAITING_QUERY ──
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div
                className={
                  m.role === 'user'
                    ? 'intel-card px-3 py-2 max-w-[80%] border-[hsl(var(--intel-accent)/0.5)]'
                    : 'intel-card px-3 py-2 max-w-full w-full'
                }
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <IntelBadge severity={m.role === 'user' ? 'info' : 'ok'}>
                    {m.role === 'user' ? 'OPERATOR' : 'SYSTEM'}
                  </IntelBadge>
                  <span className="intel-mono text-[10px] text-muted-foreground">
                    {m.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-foreground whitespace-pre-wrap">{m.content}</p>
                {m.data && Array.isArray(m.data) && m.data.length > 0 && (
                  <div className="mt-2">
                    <DataGrid
                      columns={Object.keys(m.data[0]).slice(0, 5).map((k) => ({
                        key: k, label: k.toUpperCase(), mono: true,
                      }))}
                      rows={m.data as Array<Record<string, unknown>>}
                      getRowKey={(r, ) => JSON.stringify(r).slice(0, 40)}
                    />
                  </div>
                )}
                {m.sql && (
                  <details className="mt-2">
                    <summary className="intel-eyebrow cursor-pointer">VIEW_SQL</summary>
                    <pre className="intel-mono text-[10px] bg-muted/40 p-2 rounded mt-1 overflow-x-auto">
                      {m.sql}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="intel-card px-3 py-2 inline-flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin text-[hsl(var(--intel-accent))]" />
              <span className="intel-mono text-xs text-muted-foreground">PROCESSING…</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Pergunte sobre seus dados…"
            className="intel-mono text-xs h-9"
            disabled={loading}
          />
          <Button onClick={submit} disabled={loading || !input.trim()} size="sm" className="h-9">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </SectionFrame>

      <SectionFrame title="SUGGESTED_QUERIES" meta="HINTS">
        <div className="space-y-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { setInput(s); }}
              className="w-full text-left intel-card intel-card-hover px-2 py-1.5 text-xs flex items-start gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-[hsl(var(--intel-accent))] shrink-0 mt-0.5" />
              <span className="text-foreground">{s}</span>
            </button>
          ))}
        </div>
      </SectionFrame>
    </div>
  );
};
