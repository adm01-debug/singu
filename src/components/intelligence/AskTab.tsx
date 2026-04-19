import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, Sparkles, History as HistoryIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { useAskCrm } from '@/hooks/useAskCrm';
import { DataGrid } from '@/components/intel/DataGrid';
import { downloadCsv } from '@/lib/intelExport';

const HISTORY_KEY = 'intel-ask-history';
const MAX_HISTORY = 10;

const SUGGESTIONS = [
  'Top 10 contatos por score de relacionamento',
  'Quais empresas têm deals abertos acima de 100k?',
  'Quantas interações tive nos últimos 7 dias?',
  'Mostre os 5 deals mais antigos no pipeline',
];

const COMMANDS = [
  { cmd: '/clear', desc: 'Limpar console' },
  { cmd: '/export', desc: 'Exportar última tabela em CSV' },
  { cmd: '/help', desc: 'Listar comandos' },
];

export const AskTab = () => {
  const { messages, loading, ask, clearMessages } = useAskCrm();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // Atalho ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const persistHistory = useCallback((q: string) => {
    setHistory((prev) => {
      const next = [q, ...prev.filter((x) => x !== q)].slice(0, MAX_HISTORY);
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const exportLastTable = useCallback(() => {
    const lastWithData = [...messages].reverse().find((m) => Array.isArray(m.data) && m.data.length > 0);
    if (!lastWithData?.data) {
      toast.error('Nenhuma tabela disponível para exportar.');
      return;
    }
    downloadCsv(lastWithData.data as Array<Record<string, unknown>>, `ask-crm-${Date.now()}`);
    toast.success('CSV exportado.');
  }, [messages]);

  const submit = useCallback(() => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');

    if (q.startsWith('/')) {
      const cmd = q.toLowerCase().split(/\s+/)[0];
      if (cmd === '/clear') { clearMessages(); toast.success('Console limpo.'); return; }
      if (cmd === '/export') { exportLastTable(); return; }
      if (cmd === '/help') {
        toast.message('Comandos disponíveis', {
          description: COMMANDS.map((c) => `${c.cmd} — ${c.desc}`).join('\n'),
        });
        return;
      }
      toast.error(`Comando desconhecido: ${cmd}`);
      return;
    }

    persistHistory(q);
    ask(q);
  }, [input, loading, ask, clearMessages, exportLastTable, persistHistory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 h-[calc(100vh-260px)] min-h-[480px]">
      <SectionFrame title="QUERY_CONSOLE" meta="NL→SQL · ⌘K" className="flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[300px]" aria-live="polite">
          {messages.length === 0 && (
            <div className="text-center intel-mono text-xs text-muted-foreground py-12">
              ── AWAITING_QUERY · digite /help para comandos ──
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
                  <IntelBadge severity={m.error ? 'critical' : m.role === 'user' ? 'info' : 'ok'}>
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
                      getRowKey={(r) => JSON.stringify(r).slice(0, 40)}
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
              <Loader2 className="h-3 w-3 animate-spin text-[hsl(var(--intel-accent))]" aria-hidden />
              <span className="intel-mono text-xs text-muted-foreground">PROCESSING…</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Pergunte ou digite /help…"
            className="intel-mono text-xs h-9"
            disabled={loading}
            aria-label="Pergunta em linguagem natural"
          />
          <Button onClick={submit} disabled={loading || !input.trim()} size="sm" className="h-9" aria-label="Enviar">
            <Send className="h-3 w-3" aria-hidden />
          </Button>
        </div>
      </SectionFrame>

      <div className="space-y-3">
        <SectionFrame title="SUGGESTED_QUERIES" meta="HINTS">
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="w-full text-left intel-card intel-card-hover px-2 py-1.5 text-xs flex items-start gap-1.5"
              >
                <Sparkles className="h-3 w-3 text-[hsl(var(--intel-accent))] shrink-0 mt-0.5" aria-hidden />
                <span className="text-foreground">{s}</span>
              </button>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame
          title="HISTORY"
          meta={`${history.length}/${MAX_HISTORY}`}
          actions={
            history.length > 0 ? (
              <button
                onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
                className="intel-mono text-[10px] text-muted-foreground hover:text-destructive"
                aria-label="Limpar histórico"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </button>
            ) : null
          }
        >
          {history.length === 0 ? (
            <div className="intel-mono text-[10px] text-muted-foreground text-center py-2">
              ── EMPTY ──
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((q, i) => (
                <button
                  key={`${q}-${i}`}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="w-full text-left intel-card intel-card-hover px-2 py-1 text-[11px] flex items-start gap-1.5"
                >
                  <HistoryIcon className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
                  <span className="text-foreground truncate">{q}</span>
                </button>
              ))}
            </div>
          )}
        </SectionFrame>
      </div>
    </div>
  );
};
