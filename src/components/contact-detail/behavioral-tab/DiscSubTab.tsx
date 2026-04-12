import { Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { DISCCommunicationLogsPanel } from '@/components/contact-detail/DISCCommunicationLogsPanel';
import type { Tables } from '@/integrations/supabase/types';

const DISC_LABELS: Record<string, { name: string; color: string }> = {
  D: { name: 'Dominante', color: 'text-destructive bg-destructive dark:bg-destructive/30' },
  I: { name: 'Influente', color: 'text-warning bg-warning dark:bg-warning/30' },
  S: { name: 'Estável', color: 'text-success bg-success dark:bg-success/30' },
  C: { name: 'Conforme', color: 'text-info bg-info dark:bg-info/30' },
};

interface Props {
  contactId: string;
  discProfile: string | null;
  discConfidence: number;
  discHistory: Tables<'disc_analysis_history'>[];
}

export function DiscSubTab({ contactId, discProfile, discConfidence, discHistory }: Props) {
  const latestDisc = discHistory[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-primary" />
              Perfil DISC Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            {discProfile ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold',
                    DISC_LABELS[discProfile]?.color || 'bg-muted'
                  )}>
                    {discProfile}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{DISC_LABELS[discProfile]?.name || discProfile}</p>
                    <p className="text-xs text-muted-foreground">Confiança: {discConfidence}%</p>
                  </div>
                </div>
                {latestDisc && (
                  <div className="space-y-2">
                    {(['dominance_score', 'influence_score', 'steadiness_score', 'conscientiousness_score'] as const).map(key => {
                      const labels: Record<string, string> = { dominance_score: 'D', influence_score: 'I', steadiness_score: 'S', conscientiousness_score: 'C' };
                      const shortLabel = labels[key];
                      const value = (latestDisc[key] as number) || 0;
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-6 text-xs font-bold text-muted-foreground">{shortLabel}</span>
                          <Progress value={value} className="h-2 flex-1" />
                          <span className="w-8 text-right text-xs text-muted-foreground">{value}%</span>
                        </div>
                      );
                    })}
                    {latestDisc.blend_profile && (
                      <p className="text-xs text-muted-foreground">Blend: {latestDisc.blend_profile}</p>
                    )}
                    {latestDisc.stress_primary && (
                      <p className="text-xs text-muted-foreground">
                        Sob pressão: {latestDisc.stress_primary}
                        {latestDisc.stress_secondary && ` / ${latestDisc.stress_secondary}`}
                      </p>
                    )}
                    {latestDisc.profile_summary && (
                      <p className="text-xs text-foreground mt-2">{latestDisc.profile_summary}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Perfil DISC ainda não identificado</p>
            )}
          </CardContent>
        </Card>

        {discHistory.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Histórico DISC ({discHistory.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {discHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', DISC_LABELS[entry.primary_profile]?.color)}>
                        {entry.primary_profile}
                      </Badge>
                      {entry.secondary_profile && (
                        <span className="text-muted-foreground">/ {entry.secondary_profile}</span>
                      )}
                      <span className="text-muted-foreground">{entry.confidence}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground">
                        {new Date(entry.analyzed_at).toLocaleDateString('pt-BR')}
                      </span>
                      {entry.analysis_source && (
                        <p className="text-muted-foreground/70">{entry.analysis_source}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <DISCCommunicationLogsPanel contactId={contactId} />
    </div>
  );
}
