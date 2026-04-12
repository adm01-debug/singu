import { Handshake, TrendingUp, MessageSquare, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useRapportPoints } from '@/hooks/useRapportPoints';
import { useRapportIntel } from '@/hooks/useRapportIntelView';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const LEVEL_COLORS: Record<string, string> = {
  excellent: 'text-success', good: 'text-info', moderate: 'text-warning', low: 'text-destructive',
};

export function RapportCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useRapportPoints(contactId);
  const { data: rapportIntel } = useRapportIntel(contactId);
  const icon = <Handshake className="h-4 w-4 text-success" />;

  return (
    <ExternalDataCard title="Pontos de Rapport" icon={icon} isLoading={isLoading} error={error} hasData={!!data} emptyMessage="Sem dados de rapport" onRetry={refetch}>
      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">{icon} Pontos de Rapport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-success/20">
                <span className="text-lg font-bold text-success">{data.rapport_score ?? '—'}</span>
              </div>
              <div>
                {data.rapport_level && <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[data.rapport_level] || '')}>{data.rapport_level}</Badge>}
                {data.rapport_status && <p className="text-xs text-muted-foreground mt-0.5">{data.rapport_status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.pace && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Ritmo</p><p className="font-medium text-foreground">{data.pace}</p></div>}
              {data.tone && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Tom</p><p className="font-medium text-foreground">{data.tone}</p></div>}
              {data.detail_preference && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Detalhes</p><p className="font-medium text-foreground">{data.detail_preference}</p></div>}
              {data.decision_style && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Decisão</p><p className="font-medium text-foreground">{data.decision_style}</p></div>}
            </div>

            <div className="flex flex-wrap gap-1">
              {data.prefers_data && <Badge variant="secondary" className="text-[10px]">📊 Dados</Badge>}
              {data.prefers_stories && <Badge variant="secondary" className="text-[10px]">📖 Histórias</Badge>}
              {data.prefers_visuals && <Badge variant="secondary" className="text-[10px]">🎨 Visuais</Badge>}
            </div>

            {data.shared_interests && data.shared_interests.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Interesses Compartilhados</p>
                <div className="flex flex-wrap gap-1">{data.shared_interests.map((i, idx) => <Badge key={idx} variant="outline" className="text-[10px]">{i}</Badge>)}</div>
              </div>
            )}

            {data.mirroring_tips && data.mirroring_tips.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><MessageSquare className="h-3 w-3" /> Dicas de Espelhamento</p>
                <ul className="space-y-0.5">{data.mirroring_tips.slice(0, 3).map((tip, i) => <li key={i} className="text-xs text-foreground">• {tip}</li>)}</ul>
              </div>
            )}

            {data.improvement_suggestions && data.improvement_suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3" /> Melhorias Sugeridas</p>
                <ul className="space-y-0.5">{data.improvement_suggestions.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </ExternalDataCard>
  );
}
