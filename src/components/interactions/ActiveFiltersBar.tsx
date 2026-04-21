import React from 'react';
import { Search, User, Building2, Calendar, MessageSquare, Phone, Mail, Users, Video, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdvancedFilters } from '@/hooks/useInteractionsAdvancedFilter';

const CHANNEL_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  whatsapp: { label: 'WhatsApp', Icon: MessageSquare },
  call: { label: 'Ligação', Icon: Phone },
  email: { label: 'Email', Icon: Mail },
  meeting: { label: 'Reunião', Icon: Users },
  video_call: { label: 'Vídeo', Icon: Video },
  note: { label: 'Nota', Icon: FileText },
};

interface Props {
  filters: AdvancedFilters;
  setFilter: <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => void;
  clear: () => void;
  activeCount: number;
  totalCount: number;
  visibleCount: number;
  contactLabel?: string | null;
  companyLabel?: string | null;
}

function fmtDate(d: Date): string {
  try {
    return format(d, "dd MMM yy", { locale: ptBR });
  } catch {
    return '';
  }
}

export const ActiveFiltersBar = React.memo(function ActiveFiltersBar({
  filters, setFilter, clear, activeCount, totalCount, visibleCount, contactLabel, companyLabel,
}: Props) {
  const canais = Array.isArray(filters.canais) ? filters.canais : [];
  const qTrim = (filters.q ?? '').trim();

  const summary = (() => {
    if (totalCount === 0) return 'Nenhuma interação';
    if (activeCount === 0) return `${totalCount} interações`;
    if (visibleCount === totalCount) return `${totalCount} resultados`;
    return `Mostrando ${visibleCount} de ${totalCount}`;
  })();

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <span className="text-xs text-muted-foreground mr-1">{summary}</span>

      {qTrim && (
        <Badge variant="secondary" closeable onClose={() => setFilter('q', '')} icon={<Search className="w-3 h-3" />}>
          Busca: {qTrim}
        </Badge>
      )}

      {filters.direcao === 'inbound' && (
        <Badge variant="secondary" closeable onClose={() => setFilter('direcao', 'all')} icon={<ArrowDownLeft className="w-3 h-3" />}>
          Recebidas
        </Badge>
      )}

      {filters.direcao === 'outbound' && (
        <Badge variant="secondary" closeable onClose={() => setFilter('direcao', 'all')} icon={<ArrowUpRight className="w-3 h-3" />}>
          Enviadas
        </Badge>
      )}

      {filters.contact && (
        <Badge variant="secondary" closeable onClose={() => setFilter('contact', '')} icon={<User className="w-3 h-3" />}>
          Pessoa: {contactLabel || filters.contact.slice(0, 8)}
        </Badge>
      )}

      {filters.company && (
        <Badge variant="secondary" closeable onClose={() => setFilter('company', '')} icon={<Building2 className="w-3 h-3" />}>
          Empresa: {companyLabel || filters.company.slice(0, 8)}
        </Badge>
      )}

      {canais.map((c) => {
        const meta = CHANNEL_META[c];
        const Icon = meta?.Icon;
        const label = meta?.label ?? c.charAt(0).toUpperCase() + c.slice(1);
        return (
          <Badge
            key={c}
            variant="secondary"
            closeable
            onClose={() => setFilter('canais', canais.filter((x) => x !== c))}
            icon={Icon ? <Icon className="w-3 h-3" /> : undefined}
          >
            {label}
          </Badge>
        );
      })}

      {filters.de instanceof Date && (
        <Badge variant="secondary" closeable onClose={() => setFilter('de', undefined)} icon={<Calendar className="w-3 h-3" />}>
          De: {fmtDate(filters.de)}
        </Badge>
      )}

      {filters.ate instanceof Date && (
        <Badge variant="secondary" closeable onClose={() => setFilter('ate', undefined)} icon={<Calendar className="w-3 h-3" />}>
          Até: {fmtDate(filters.ate)}
        </Badge>
      )}

      {activeCount >= 2 && (
        <Button variant="ghost" size="xs" onClick={clear} className="ml-auto">
          Limpar tudo
        </Button>
      )}
    </div>
  );
});
