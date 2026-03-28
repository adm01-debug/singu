import { motion } from 'framer-motion';
import {
  Award,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS, TRIGGER_CATEGORIES } from '@/types/triggers';
import { DISCProfile, TriggerEffectiveness, DISC_BG_COLORS } from './TriggerAnalyticsTypes';

interface TriggerRankingTabProps {
  triggerStats: TriggerEffectiveness[];
}

export function TriggerRankingTab({ triggerStats }: TriggerRankingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="w-4 h-4" />
          Ranking de Gatilhos por Efetividade
        </CardTitle>
        <CardDescription>Gatilhos ordenados por taxa de sucesso e nota média</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {triggerStats.map((triggerStat, index) => {
              const trigger = MENTAL_TRIGGERS[triggerStat.triggerType];
              const categoryInfo = trigger ? TRIGGER_CATEGORIES[trigger.category] : null;

              return (
                <motion.div
                  key={triggerStat.triggerType}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Trigger info */}
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', trigger?.color)}>
                    {trigger?.icon || '🎯'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{trigger?.name || triggerStat.triggerType}</h4>
                      {categoryInfo && (
                        <Badge variant="outline" className="text-xs">
                          {categoryInfo.icon} {categoryInfo.name}
                        </Badge>
                      )}
                    </div>

                    {/* DISC breakdown */}
                    <div className="flex items-center gap-2 mt-2">
                      {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((disc) => {
                        const discData = triggerStat.byDISC[disc];
                        if (discData.usages === 0) return null;
                        return (
                          <Badge
                            key={disc}
                            variant="secondary"
                            className={cn('text-xs', DISC_BG_COLORS[disc])}
                          >
                            {disc}: {discData.successRate.toFixed(0)}%
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right space-y-1">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Usos:</span>{' '}
                      <span className="font-semibold">{triggerStat.totalUsages}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Sucesso:</span>{' '}
                      <span className="font-semibold text-emerald-600">{triggerStat.successRate.toFixed(0)}%</span>
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold">{(triggerStat.avgRating / 20).toFixed(1)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
