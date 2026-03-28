import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { DISCProfile, DISCTriggerStats, DISC_BG_COLORS, DISC_NAMES } from './TriggerAnalyticsTypes';

interface DISCProfileTabProps {
  byDISC: Record<DISCProfile, DISCTriggerStats>;
}

export function DISCProfileTab({ byDISC }: DISCProfileTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Object.values(byDISC).map((discStats) => (
        <Card key={discStats.discProfile}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Badge className={cn('text-base px-3 py-1', DISC_BG_COLORS[discStats.discProfile])}>
                {discStats.discProfile}
              </Badge>
              <span className="text-base">{DISC_NAMES[discStats.discProfile]}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{discStats.totalUsages}</p>
                <p className="text-xs text-muted-foreground">Usos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{discStats.successRate.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Sucesso</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{(discStats.avgRating / 20).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Nota</p>
              </div>
            </div>

            {/* Top triggers */}
            {discStats.topTriggers.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Gatilhos mais usados:</p>
                <div className="space-y-2">
                  {discStats.topTriggers.map((t) => {
                    const trigger = MENTAL_TRIGGERS[t.type];
                    return (
                      <div key={t.type} className="flex items-center gap-2">
                        <span className="text-lg">{trigger?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{trigger?.name || t.type}</p>
                          <Progress value={t.successRate} className="h-1.5" />
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-muted-foreground">{t.count}x</p>
                          <p className="text-emerald-600">{t.successRate.toFixed(0)}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {discStats.topTriggers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum gatilho usado com este perfil ainda.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
