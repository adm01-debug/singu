import { Brain, Target, Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { NLPBriefing } from '@/hooks/usePreContactBriefing';
import { vakIcons, vakColors } from './briefing-constants';
import { cn } from '@/lib/utils';

interface BriefingQuickStatsProps {
  briefing: NLPBriefing;
}

export function BriefingQuickStats({ briefing }: BriefingQuickStatsProps) {
  const VAKIcon = vakIcons[briefing.vakProfile.dominant] || Brain;
  const TrendIcon = briefing.emotionalProfile.trend === 'improving' ? TrendingUp :
                    briefing.emotionalProfile.trend === 'declining' ? TrendingDown : Minus;

  return (
    <>
      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {/* VAK */}
        <div className={cn("p-3 rounded-lg text-center", vakColors[briefing.vakProfile.dominant])}>
          <VAKIcon className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs font-medium">{briefing.vakProfile.dominant}</p>
          <p className="text-[10px] opacity-70">Estilo PNL</p>
        </div>

        {/* DISC */}
        <div className="p-3 rounded-lg text-center bg-secondary/50">
          <Target className="w-5 h-5 mx-auto mb-1 text-foreground" />
          <p className="text-xs font-medium">{briefing.discProfile.type || 'N/A'}</p>
          <p className="text-[10px] text-muted-foreground">Perfil DISC</p>
        </div>

        {/* Emotional State */}
        <div className={cn(
          "p-3 rounded-lg text-center",
          briefing.emotionalProfile.currentState === 'Positivo' ? 'bg-success/10 text-success' :
          briefing.emotionalProfile.currentState === 'Cauteloso' ? 'bg-warning/10 text-warning' :
          'bg-muted text-muted-foreground'
        )}>
          <TrendIcon className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs font-medium">{briefing.emotionalProfile.currentState}</p>
          <p className="text-[10px] opacity-70">Estado</p>
        </div>

        {/* Rapport Score */}
        <div className={cn(
          "p-3 rounded-lg text-center",
          briefing.rapportScore >= 70 ? 'bg-success/10 text-success' :
          briefing.rapportScore >= 40 ? 'bg-warning/10 text-warning' :
          'bg-destructive/10 text-destructive'
        )}>
          <Heart className="w-5 h-5 mx-auto mb-1" />
          <p className="text-xs font-medium">{briefing.rapportScore}%</p>
          <p className="text-[10px] opacity-70">Rapport</p>
        </div>
      </div>

      {/* Last Interaction */}
      {briefing.lastInteractionSummary && (
        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p className="text-xs text-muted-foreground mb-1">Ultima interacao:</p>
          <p className="font-medium">{briefing.lastInteractionSummary}</p>
        </div>
      )}
    </>
  );
}
