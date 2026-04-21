import { memo } from 'react';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { InlineEmptyState } from '@/components/ui/empty-state';
import type { ContactView360 } from '@/hooks/useContactView360';

interface Props {
  profile: ContactView360 | null;
}

const DISC_LABELS: Record<string, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Conformista',
};

export const PerfilComportamentalCard = memo(({ profile }: Props) => {
  const hasDisc = profile?.disc_primary;
  const confidence = profile?.disc_confidence ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="h-4 w-4 text-primary" />
          Perfil Comportamental
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasDisc ? (
          <InlineEmptyState
            icon={Brain}
            title="Perfil DISC não analisado"
            description="A análise comportamental aparecerá conforme as interações forem processadas."
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="text-sm">
                {profile?.disc_primary} — {DISC_LABELS[profile?.disc_primary ?? ''] ?? 'Perfil'}
              </Badge>
              {profile?.disc_secondary && (
                <Badge variant="outline" className="text-sm">
                  Secundário: {profile.disc_secondary}
                </Badge>
              )}
              {profile?.disc_blend && (
                <Badge variant="secondary" className="text-xs">
                  Mistura: {profile.disc_blend}
                </Badge>
              )}
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Confiança da análise</span>
                <span className="font-medium text-foreground">{Math.round(confidence * 100)}%</span>
              </div>
              <Progress value={confidence * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground">EQ Level</p>
                <p className="text-sm font-medium">
                  {profile?.eq_level ?? '—'}{' '}
                  {profile?.eq_score != null && (
                    <span className="text-muted-foreground">({profile.eq_score})</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sentimento</p>
                <p className="text-sm font-medium capitalize">
                  {profile?.sentiment ?? '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
PerfilComportamentalCard.displayName = 'PerfilComportamentalCard';
