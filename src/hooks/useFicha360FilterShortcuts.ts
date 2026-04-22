import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useScopedShortcut } from '@/lib/keyboardShortcutRegistry';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

interface Options {
  days: number;
  channels: string[];
  q: string;
  hasPeriodChip: boolean;
  onClearAll: () => void;
  onClearPeriod: () => void;
  onClearSearch: () => void;
  onRemoveChannel: (channel: string) => void;
  onCopyLink?: () => void;
  enabled: boolean;
}

/**
 * Registra atalhos de teclado escopados para gerenciar chips de filtros
 * ativos da Ficha 360 (período, canais, busca textual).
 *
 * Escopo: 'ficha360-filtros' — aparece automaticamente no cheatsheet (?).
 */
export function useFicha360FilterShortcuts({
  days,
  channels,
  q,
  hasPeriodChip,
  onClearAll,
  onClearPeriod,
  onClearSearch,
  onRemoveChannel,
  onCopyLink,
  enabled,
}: Options) {
  // Refs garantem que handlers leiam estado atual sem re-registrar atalhos.
  const stateRef = useRef({ days, channels, q, hasPeriodChip, enabled });
  useEffect(() => {
    stateRef.current = { days, channels, q, hasPeriodChip, enabled };
  }, [days, channels, q, hasPeriodChip, enabled]);

  const handlersRef = useRef({ onClearAll, onClearPeriod, onClearSearch, onRemoveChannel, onCopyLink });
  useEffect(() => {
    handlersRef.current = { onClearAll, onClearPeriod, onClearSearch, onRemoveChannel, onCopyLink };
  }, [onClearAll, onClearPeriod, onClearSearch, onRemoveChannel, onCopyLink]);

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'c',
    shift: true,
    description: 'Limpar todos os filtros (período, canais, busca)',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      const hadAny = s.hasPeriodChip || s.channels.length > 0 || s.q.trim().length > 0;
      if (!hadAny) return;
      handlersRef.current.onClearAll();
      toast.info('Filtros limpos', { duration: 1500 });
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'p',
    shift: true,
    description: 'Remover filtro de período (volta para 90d)',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled || !s.hasPeriodChip) return;
      handlersRef.current.onClearPeriod();
      toast.info('Período limpo', { duration: 1500 });
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'b',
    shift: true,
    description: 'Remover filtro de busca textual',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled || !s.q.trim()) return;
      handlersRef.current.onClearSearch();
      toast.info('Busca limpa', { duration: 1500 });
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'l',
    shift: true,
    description: 'Copiar link com filtros atuais',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      const hasAny = s.hasPeriodChip || s.channels.length > 0 || s.q.trim().length > 0;
      if (!hasAny) return;
      handlersRef.current.onCopyLink?.();
    },
  });

  // Shift+1..5 → remove o N-ésimo chip de canal visível.
  for (let i = 1; i <= 5; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useScopedShortcut({
      scope: 'ficha360-filtros',
      keys: String(i),
      shift: true,
      description: `Remover ${i}º chip de canal`,
      handler: () => {
        const s = stateRef.current;
        if (!s.enabled) return;
        const channel = s.channels[i - 1];
        if (!channel) return;
        handlersRef.current.onRemoveChannel(channel);
        const label = CHANNEL_LABELS[channel] ?? channel;
        toast.info(`Canal ${label} removido`, { duration: 1500 });
      },
    });
  }
}
