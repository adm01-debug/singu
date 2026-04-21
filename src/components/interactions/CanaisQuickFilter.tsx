import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, Phone, Mail, Users, Video, FileText, Zap, MousePointerClick, Check, X } from 'lucide-react';
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
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export const CanaisQuickFilter = React.memo(function CanaisQuickFilter({ canais, onChange }: Props) {
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-1">
        {CHANNELS.map((opt) => {
          const Icon = opt.icon;
          const inPending = pending.includes(opt.value);
          const inApplied = safe.includes(opt.value);
          const isDifferent = mode === 'manual' && inPending !== inApplied;
          return (
            <Badge
              key={opt.value}
              variant={inPending ? 'default' : 'outline'}
              role="button"
              aria-pressed={inPending}
              title={opt.label}
              onClick={() => toggleCanal(opt.value)}
              className={cn(
                'cursor-pointer gap-1 px-2 py-1 text-xs transition-colors select-none',
                !inPending && 'hover:bg-muted',
                isDifferent && 'border-dashed',
              )}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden sm:inline">{opt.label}</span>
            </Badge>
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
                  onClick={revert}
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
      </div>
    </TooltipProvider>
  );
});
