import {
  CheckCircle2, AlertCircle, Lightbulb, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DISCBadge } from '@/components/ui/disc-badge';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { DISCProfile } from '@/types';
import { cn } from '@/lib/utils';
import { DISC_BG_COLORS } from './DISCAnalyticsTypes';

interface CompatibilityInsights {
  bestPerforming?: DISCProfile;
  needsImprovement?: DISCProfile;
}

interface DISCInsightsTabProps {
  compatibilityInsights: CompatibilityInsights | undefined;
}

export const DISCInsightsTab = ({ compatibilityInsights }: DISCInsightsTabProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Compatibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Melhor Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DISCBadge
                  profile={compatibilityInsights?.bestPerforming || 'I'}
                  size="lg"
                />
                <div>
                  <p className="font-medium">
                    {DISC_PROFILES[compatibilityInsights?.bestPerforming || 'I']?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Perfil com melhor taxa de conversao
                  </p>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  Priorize contatos com este perfil para maximizar resultados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Needs Improvement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Oportunidade de Melhoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DISCBadge
                  profile={compatibilityInsights?.needsImprovement || 'C'}
                  size="lg"
                />
                <div>
                  <p className="font-medium">
                    {DISC_PROFILES[compatibilityInsights?.needsImprovement || 'C']?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Perfil com maior potencial de crescimento
                  </p>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <Lightbulb className="w-4 h-4 inline mr-1" />
                  Estude as estrategias especificas para este perfil
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dicas por Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['D', 'I', 'S', 'C'] as const).map(profile => {
              const info = DISC_PROFILES[profile];
              return (
                <div key={profile} className={cn(
                  "p-4 rounded-lg border",
                  DISC_BG_COLORS[profile].replace('text-', 'border-')
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <DISCBadge profile={profile} size="sm" showLabel={false} />
                    <span className="font-medium">{info?.name}</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {info?.salesApproach.presentation.slice(0, 2).map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
