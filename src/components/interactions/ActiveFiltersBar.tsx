import React from 'react';
import { Search, User, Building2, Calendar, MessageSquare, Phone, Mail, Users, Video, FileText, ArrowDownLeft, ArrowUpRight, Tag, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdvancedFilters, SentimentoFilter } from '@/hooks/useInteractionsAdvancedFilter';

const CHANNEL_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  whatsapp: { label: 'WhatsApp', Icon: MessageSquare },
  call: { label: 'Ligação', Icon: Phone },
  email: { label: 'Email', Icon: Mail },
  meeting: { label: 'Reunião', Icon: Users },
  video_call: { label: 'Vídeo', Icon: Video },
  note: { label: 'Nota', Icon: FileText },
};

const SENTIMENTO_META: Record<SentimentoFilter, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  positive: { label: 'Positivo', Icon: Smile },
  neutral:  { label: 'Neutro',   Icon: Meh },
  negative: { label: 'Negativo', Icon: Frown },
  mixed:    { label: 'Misto',    Icon: Sparkles },
};

interface Props {
  filters: AdvancedFilters;
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  clear: () => void;
  /**
   * Limpa `de` e `ate` em uma única operação atômica (single setSearchParams).
   * Usado nas badges de período para evitar dois `setFilter` em sequência que
   * poderiam divergir caso o usuário fechasse ambas as badges no mesmo tick.
   */
  clearDateRange?: () => boolean;
  activeCount: number;
  totalCount: number;
  visibleCount: number;
  contactLabel?: string | null;
  companyLabel?: string | null;
  onAfterRemove?: () => void;
  /**
   * Modo agrupado ativo (por pessoa/empresa). Quando true, o resumo mostra
   * a contagem de grupos visíveis junto do total de interações exibidas.
   * No modo lista o comportamento permanece inalterado.
   */
  groupedMode?: boolean;
  /** Total de grupos visíveis na página atual (apenas no modo agrupado). */
  groupCount?: number;
  /** Rótulo da entidade agrupadora ('pessoa' | 'empresa'). Default: 'grupo'. */
  groupLabelSingular?: string;
  groupLabelPlural?: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Formato numérico padrão PT-BR: dd/mm/aa */
function fmtDate(d: Date): string {
  if (!(d instanceof Date) || isNaN(d.getTime())) return '';
  const yy = d.getFullYear().toString().slice(-2);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${yy}`;
}

/** Sanitiza e capitaliza nomes de canal desconhecidos para exibição. */
function prettifyChannel(raw: string): string {
  const cleaned = (raw ?? '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!cleaned) return 'Canal';
  return cleaned.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export const ActiveFiltersBar = React.memo(function ActiveFiltersBar({
  filters, setFilter, clear, activeCount, totalCount, visibleCount, contactLabel, companyLabel, onAfterRemove,
  groupedMode = false, groupCount = 0, groupLabelSingular = 'grupo', groupLabelPlural = 'grupos',
}: Props) {
  const canais = Array.isArray(filters.canais) ? filters.canais : [];
  const qTrim = (filters.q ?? '').trim();

  // Executa a ação de remoção e, em seguida, devolve o foco ao input de busca
  // sem reposicionar a página (preventScroll) e mantendo o cursor ao final.
  const wrap = React.useCallback((fn: () => void) => () => {
    fn();
    onAfterRemove?.();
  }, [onAfterRemove]);

  const summary = (() => {
    if (totalCount === 0) return 'Nenhuma interação';
    if (groupedMode) {
      const gLabel = groupCount === 1 ? groupLabelSingular : groupLabelPlural;
      const iLabel = visibleCount === 1 ? 'interação' : 'interações';
      if (groupCount === 0) return `Nenhum ${groupLabelSingular} no escopo atual`;
      if (activeCount === 0 && visibleCount === totalCount) {
        return `${groupCount} ${gLabel} · ${visibleCount} ${iLabel}`;
      }
      return `${groupCount} ${gLabel} · ${visibleCount} de ${totalCount} ${iLabel}`;
    }
    if (activeCount === 0) return `${totalCount} interações`;
    if (visibleCount === totalCount) return `${totalCount} resultados`;
    return `Mostrando ${visibleCount} de ${totalCount}`;
  })();

  // Resumo de canais ativos — reflete exatamente o param ?canais= da URL
  // (filters.canais vem do hook useInteractionsAdvancedFilter, que parseia a URL).
  // Mostramos até 3 nomes inline e abreviamos o restante com "+N", com tooltip
  // contendo a lista completa para acessibilidade e descoberta.
  const channelLabels = canais.map((c) => CHANNEL_META[c]?.label ?? prettifyChannel(c));
  const MAX_INLINE = 3;
  const inlineLabels = channelLabels.slice(0, MAX_INLINE);
  const overflowCount = channelLabels.length - inlineLabels.length;
  const fullChannelsTitle = channelLabels.join(', ');

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <span className="text-xs text-muted-foreground mr-1">{summary}</span>

      {canais.length > 0 && (
        <span
          className="inline-flex items-center gap-1 text-xs text-muted-foreground border-l border-border/60 pl-2"
          title={`Canais ativos (${canais.length}): ${fullChannelsTitle}`}
          aria-label={`${canais.length} ${canais.length === 1 ? 'canal ativo' : 'canais ativos'}: ${fullChannelsTitle}`}
        >
          <span className="font-medium text-foreground/80 tabular-nums">
            {canais.length} {canais.length === 1 ? 'canal' : 'canais'}:
          </span>
          <span className="max-w-[260px] truncate">
            {inlineLabels.join(', ')}
            {overflowCount > 0 && ` +${overflowCount}`}
          </span>
        </span>
      )}

      {qTrim && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('q', ''))} icon={<Search className="w-3 h-3" />}>
          Busca “{qTrim}”
        </Badge>
      )}

      {filters.direcao === 'inbound' && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('direcao', 'all'))} icon={<ArrowDownLeft className="w-3 h-3" />}>
          Recebidas
        </Badge>
      )}

      {filters.direcao === 'outbound' && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('direcao', 'all'))} icon={<ArrowUpRight className="w-3 h-3" />}>
          Enviadas
        </Badge>
      )}

      {filters.contact && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('contact', ''))} icon={<User className="w-3 h-3" />}>
          Pessoa {contactLabel || filters.contact.slice(0, 8)}
        </Badge>
      )}

      {filters.company && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('company', ''))} icon={<Building2 className="w-3 h-3" />}>
          Empresa {companyLabel || filters.company.slice(0, 8)}
        </Badge>
      )}

      {canais.map((c) => {
        const meta = CHANNEL_META[c];
        const isKnown = !!meta;
        const Icon = isKnown ? meta.Icon : Tag;
        const label = isKnown ? meta.label : prettifyChannel(c);
        return (
          <Badge
            key={c}
            variant="secondary"
            closeable
            onClose={wrap(() => setFilter('canais', canais.filter((x) => x !== c)))}
            icon={<Icon className="w-3 h-3" />}
            title={isKnown ? undefined : `Canal desconhecido: ${c}`}
          >
            {label}
          </Badge>
        );
      })}

      {filters.de instanceof Date && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('de', undefined))} icon={<Calendar className="w-3 h-3" />}>
          Período desde {fmtDate(filters.de)}
        </Badge>
      )}

      {filters.sentimento && SENTIMENTO_META[filters.sentimento] && (() => {
        const meta = SENTIMENTO_META[filters.sentimento];
        const Icon = meta.Icon;
        return (
          <Badge
            variant="secondary"
            closeable
            onClose={wrap(() => setFilter('sentimento', undefined))}
            icon={<Icon className="w-3 h-3" />}
          >
            Sentimento {meta.label}
          </Badge>
        );
      })()}

      {filters.ate instanceof Date && (
        <Badge variant="secondary" closeable onClose={wrap(() => setFilter('ate', undefined))} icon={<Calendar className="w-3 h-3" />}>
          Período até {fmtDate(filters.ate)}
        </Badge>
      )}

      {activeCount >= 1 && (
        <Button
          variant="ghost"
          size="xs"
          onClick={wrap(clear)}
          aria-label="Limpar todos os filtros e remover preferências salvas"
          title="Apaga canais aplicados, datas, sentimento, busca e remove a persistência do localStorage"
          className="ml-auto"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
});
