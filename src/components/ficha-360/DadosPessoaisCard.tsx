import { memo } from 'react';
import { Cake, Heart, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { RapportIntel } from '@/hooks/useRapportIntelView';

interface Props {
  rapportIntel: RapportIntel | null;
}

function formatBirthday(date?: string | null): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  } catch {
    return null;
  }
}

export const DadosPessoaisCard = memo(({ rapportIntel }: Props) => {
  const birthday = formatBirthday(rapportIntel?.birthday);
  const family = rapportIntel?.family_info;
  const anchors = Array.isArray(rapportIntel?.positive_anchors) ? rapportIntel.positive_anchors : [];
  const events = Array.isArray(rapportIntel?.upcoming_events) ? rapportIntel.upcoming_events : [];

  const isEmpty = !birthday && !family && anchors.length === 0 && events.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-primary" />
          Dados Pessoais Relevantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <InlineEmptyState
            icon={Heart}
            title="Sem dados pessoais"
            description="Aniversário, família e âncoras positivas ajudam a personalizar a abordagem."
          />
        ) : (
          <div className="space-y-3">
            {birthday && (
              <div className="flex items-start gap-2">
                <Cake className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Aniversário</p>
                  <p className="text-sm font-medium">{birthday}</p>
                </div>
              </div>
            )}
            {family && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Família</p>
                  <p className="text-sm">{family}</p>
                </div>
              </div>
            )}
            {anchors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Âncoras positivas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {anchors.slice(0, 8).map((a, i) => (
                    <Badge key={`anchor-${i}`} variant="secondary" className="text-xs font-normal">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {events.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Próximos eventos</p>
                <ul className="space-y-1">
                  {events.slice(0, 5).map((e, i) => (
                    <li key={`event-${i}`} className="text-sm text-foreground">
                      • {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
DadosPessoaisCard.displayName = 'DadosPessoaisCard';
