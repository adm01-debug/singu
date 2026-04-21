import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Phone, Mail, Users, Video, FileText, Zap, MousePointerClick, Check, X, Eraser } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useChannelSyncMode } from '@/hooks/useChannelSyncMode';
import { toast } from 'sonner';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'video_call', label: 'Vídeo', icon: Video },
  { value: 'note', label: 'Nota', icon: FileText },
] as const;

const PENDING_KEY = 'channel-pending-canais';
const VALID_VALUES = new Set(CHANNELS.map((c) => c.value));

function readPending(): string[] | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const filtered = parsed.filter((v): v is string => typeof v === 'string' && VALID_VALUES.has(v as typeof CHANNELS[number]['value']));
    return filtered;
  } catch {
    return null;
  }
}

function writePending(next: string[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* noop */
  }
}

interface Props {
  canais: string[];
  onChange: (next: string[]) => void;
  /**
   * Mapa opcional `canal → quantidade` calculado no dataset filtrado pelos
   * demais critérios (sem aplicar o próprio filtro de canal). Quando ausente,
   * os chips renderizam só o ícone (comportamento legado).
   */
  counts?: Record<string, number>;
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export const CanaisQuickFilter = React.memo(function CanaisQuickFilter({ canais, onChange, counts }: Props) {
  const safe = useMemo(() => (Array.isArray(canais) ? canais : []), [canais]);
  const { mode, toggle } = useChannelSyncMode();
  const [pending, setPendingState] = useState<string[]>(() => {
    // Restaura pending salvo apenas se modo for manual e diferir do aplicado
    try {
      const savedMode = localStorage.getItem('channel-sync-mode');
      if (savedMode === 'manual') {
        const saved = readPending();
        if (saved) return saved;
      }
    } catch { /* noop */ }
    return Array.isArray(canais) ? canais : [];
  });

  const setPending = useCallback((next: string[] | ((prev: string[]) => string[])) => {
    setPendingState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      return value;
    });
  }, []);

  // Sincroniza pending com prop quando ela muda externamente (preset, clear, etc.)
  // Só sobrescreve se NÃO houver pending persistido divergente no modo manual.
  useEffect(() => {
    setPendingState((prev) => {
      // Se prev já é igual a safe, nada a fazer
      if (arraysEqual(prev, safe)) return prev;
      // No modo manual, mantém o pending divergente (não sobrescreve seleções do usuário)
      if (mode === 'manual' && !arraysEqual(prev, safe)) {
        return prev;
      }
      return safe;
    });
  }, [safe, mode]);

  // Persiste pending no localStorage quando estiver no modo manual e houver divergência
  useEffect(() => {
    if (mode === 'manual' && !arraysEqual(pending, safe)) {
      writePending(pending);
    } else {
      clearPending();
    }
  }, [pending, safe, mode]);

  const dirty = mode === 'manual' && !arraysEqual(pending, safe);
  const diffCount = useMemo(() => {
    const setA = new Set(safe);
    const setB = new Set(pending);
    let n = 0;
    setB.forEach((v) => { if (!setA.has(v)) n++; });
    setA.forEach((v) => { if (!setB.has(v)) n++; });
    return n;
  }, [safe, pending]);

  const toggleCanal = useCallback((value: string) => {
    const base = mode === 'manual' ? pending : safe;
    const next = base.includes(value) ? base.filter((c) => c !== value) : [...base, value];
    if (mode === 'auto') {
      onChange(next);
    } else {
      setPending(next);
    }
  }, [mode, pending, safe, onChange]);

  const apply = useCallback(() => {
    onChange(pending);
    toast.success('Filtros de canal aplicados');
  }, [pending, onChange]);

  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false);

  const revert = useCallback(() => {
    setPending(safe);
    setConfirmRevertOpen(false);
    toast.success('Alterações pendentes descartadas');
  }, [safe]);

  const handleToggleMode = useCallback(() => {
    const goingToManual = mode === 'auto';
    toggle();
    if (goingToManual) {
      toast.info('Você está no modo manual', {
        description: 'Clique em "Aplicar" para atualizar os filtros após selecionar os canais.',
        duration: 5000,
      });
    } else {
      // voltando pro auto: aplica imediatamente o pending pra não deixar estado órfão
      if (!arraysEqual(pending, safe)) {
        onChange(pending);
      }
      toast.success('Modo automático ativado', {
        description: 'Os filtros serão aplicados ao clicar nos canais.',
        duration: 3000,
      });
    }
  }, [mode, toggle, pending, safe, onChange]);

  const clearAll = useCallback(() => {
    if (mode === 'auto') {
      if (safe.length === 0) return;
      onChange([]);
      toast.success('Filtros de canal limpos');
    } else {
      if (pending.length === 0) return;
      setPending([]);
      toast.info('Canais desmarcados', {
        description: 'Clique em "Aplicar" para confirmar.',
        duration: 3000,
      });
    }
  }, [mode, safe, pending, onChange, setPending]);

  const showClear = mode === 'auto' ? safe.length > 0 : pending.length > 0;

  // ── Atalhos de teclado: Alt+1..6 alterna canal, Alt+0 limpa. Funciona com foco em inputs.
  const [altPressed, setAltPressed] = useState(false);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === '0') {
        e.preventDefault();
        const hasAny = mode === 'auto' ? safe.length > 0 : pending.length > 0;
        if (!hasAny) return;
        clearAll();
        toast.message('Canais limpos', { duration: 1500 });
        return;
      }
      const idx = parseInt(e.key, 10);
      if (Number.isNaN(idx) || idx < 1 || idx > CHANNELS.length) return;
      e.preventDefault();
      const canal = CHANNELS[idx - 1];
      const wasActive = (mode === 'manual' ? pending : safe).includes(canal.value);
      toggleCanal(canal.value);
      toast.message(`${canal.label} ${wasActive ? 'desativado' : 'ativado'}`, { duration: 1500 });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, safe, pending, toggleCanal, clearAll]);

  // Detecta Alt pressionado para mostrar badges Alt+N nos chips
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.altKey) setAltPressed(true); };
    const onUp = (e: KeyboardEvent) => { if (!e.altKey) setAltPressed(false); };
    const onBlur = () => setAltPressed(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-1">
        {CHANNELS.map((opt, idx) => {
          const Icon = opt.icon;
          const inPending = pending.includes(opt.value);
          const inApplied = safe.includes(opt.value);
          const isDifferent = mode === 'manual' && inPending !== inApplied;
          const hasCounts = !!counts;
          const count = hasCounts ? (counts?.[opt.value] ?? 0) : undefined;
          const isEmpty = hasCounts && count === 0 && !inPending;
          const shortcutLabel = `Alt+${idx + 1}`;
          const chip = (
            <div className="relative inline-flex">
              <Badge
                variant={inPending ? 'default' : 'outline'}
                role="button"
                aria-pressed={inPending}
                aria-keyshortcuts={`Alt+${idx + 1}`}
                title={opt.label}
                onClick={() => toggleCanal(opt.value)}
                className={cn(
                  'cursor-pointer gap-1 px-2 py-1 text-xs transition-colors select-none',
                  !inPending && 'hover:bg-muted',
                  isDifferent && 'border-dashed',
                  isEmpty && 'opacity-50',
                )}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{opt.label}</span>
                {typeof count === 'number' && (
                  <span className="ml-0.5 text-[10px] tabular-nums opacity-70">
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </Badge>
              {altPressed && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-1 -right-1 rounded border border-border bg-background px-1 text-[9px] font-mono leading-tight text-muted-foreground shadow-sm"
                >
                  {idx + 1}
                </span>
              )}
            </div>
          );
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>{chip}</TooltipTrigger>
              <TooltipContent side="top">
                {isEmpty ? `Sem interações neste canal (${shortcutLabel})` : `${opt.label} (${shortcutLabel})`}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleMode}
              aria-label={mode === 'auto' ? 'Mudar para modo manual' : 'Mudar para modo automático'}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              {mode === 'auto' ? <Zap className="w-3.5 h-3.5" /> : <MousePointerClick className="w-3.5 h-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {mode === 'auto'
              ? 'Modo automático: aplica ao clicar. Clique para mudar para manual.'
              : 'Modo manual: clique em Aplicar para atualizar. Clique para voltar ao automático.'}
          </TooltipContent>
        </Tooltip>

        {showClear && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={clearAll}
                aria-label="Limpar seleção de canais"
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <Eraser className="w-3 h-3" />
                Limpar canais
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {mode === 'auto'
                ? 'Remove todos os canais selecionados (aplica imediatamente).'
                : 'Desmarca todos os canais. Clique em Aplicar para confirmar.'}
            </TooltipContent>
          </Tooltip>
        )}

        {dirty && (
          <div className="flex items-center gap-1 ml-1" aria-live="polite">
            <Button
              type="button"
              variant="default"
              size="xs"
              onClick={apply}
              className="gap-1"
            >
              <Check className="w-3 h-3" />
              Aplicar
              <span className="text-[10px] opacity-80">({diffCount})</span>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setConfirmRevertOpen(true)}
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Reverter
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Descartar alterações pendentes</TooltipContent>
            </Tooltip>
          </div>
        )}

        <AlertDialog open={confirmRevertOpen} onOpenChange={setConfirmRevertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar alterações pendentes?</AlertDialogTitle>
              <AlertDialogDescription>
                {diffCount > 0
                  ? `Você tem ${diffCount} alteração${diffCount === 1 ? '' : 'ões'} de canal pendente${diffCount === 1 ? '' : 's'} que ainda não foram aplicadas. Esta ação restaura a seleção para os filtros aplicados atuais.`
                  : 'Esta ação restaura a seleção para os filtros aplicados atuais.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={revert}>Descartar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
});
