import { memo } from 'react';
import { Calendar, MessageSquare, Phone, Mail, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Ficha360Period } from '@/hooks/useFicha360Filters';

const CHANNEL_META: Record<string, { label: string; icon: typeof MessageSquare }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  call: { label: 'Ligação', icon: Phone },
  email: { label: 'Email', icon: Mail },
  meeting: { label: 'Reunião', icon: Calendar },
  note: { label: 'Nota', icon: FileText },
};

const PERIOD_LABEL: Record<number, string> = {
  7: '7d',
  30: '30d',
  90: '90d',
  365: '1a',
};

interface Props {
  days: Ficha360Period;
  channels: string[];
  shownCount: number;
  totalCount: number;
  onRemoveDays: () => void;
  onRemoveChannel: (c: string) => void;
  onClearAll: () => void;
}

export const FiltrosAtivosChips = memo(function FiltrosAtivosChips({
  days,
  channels,
  shownCount,
  totalCount,
  onRemoveDays,
  onRemoveChannel,
  onClearAll,
}: Props) {
  const hasPeriodChip = days !== 90;
  const safeChannels = Array.isArray(channels) ? channels : [];
  const activeChipCount = (hasPeriodChip ? 1 : 0) + safeChannels.length;

  if (totalCount === 0 && activeChipCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {totalCount > 0 && (
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{shownCount}</span> de {totalCount}{' '}
          interação{totalCount === 1 ? '' : 'ões'}
        </span>
      )}

      {hasPeriodChip && (
        <Badge
          variant="secondary"
          closeable
          onClose={onRemoveDays}
          icon={<Calendar className="h-3 w-3" />}
          className="text-xs"
        >
          Período: {PERIOD_LABEL[days] ?? `${days}d`}
        </Badge>
      )}

      {safeChannels.map((c) => {
        const meta = CHANNEL_META[c] ?? { label: c, icon: FileText };
        const Icon = meta.icon;
        return (
          <Badge
            key={c}
            variant="secondary"
            closeable
            onClose={() => onRemoveChannel(c)}
            icon={<Icon className="h-3 w-3" />}
            className="text-xs"
          >
            {meta.label}
          </Badge>
        );
      })}

      {activeChipCount >= 2 && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onClearAll}
          className="ml-auto gap-1 text-muted-foreground"
        >
          <X className="h-3 w-3" /> Limpar tudo
        </Button>
      )}
    </div>
  );
});
