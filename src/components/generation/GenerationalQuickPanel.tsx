// Generational Quick Panel
// Painel compacto para exibição rápida no card de contato

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ChevronRight,
  MessageSquare,
  Target,
  AlertTriangle
} from 'lucide-react';
import { GenerationalAnalysis } from '@/types/generation';
import { GenerationBadge } from './GenerationBadge';

interface GenerationalQuickPanelProps {
  analysis: GenerationalAnalysis;
  onExpand?: () => void;
}

export function GenerationalQuickPanel({ analysis, onExpand }: GenerationalQuickPanelProps) {
  const { generation, age, confidence, recommendations } = analysis;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Perfil Geracional
          </CardTitle>
          {onExpand && (
            <Button variant="ghost" size="sm" onClick={onExpand}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Header com badge */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{generation.icon}</span>
          <div>
            <GenerationBadge 
              generation={generation.type} 
              showAge 
              age={age}
            />
            <p className="text-xs text-muted-foreground mt-0.5">
              Confiança: {confidence}%
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded p-1.5">
            <div className="text-xs font-medium">{generation.vakTendencies.dominant}</div>
            <div className="text-[10px] text-muted-foreground">VAK</div>
          </div>
          <div className="bg-muted/50 rounded p-1.5">
            <div className="text-xs font-medium">
              {generation.discTendencies.mostCommon.join('/')}
            </div>
            <div className="text-[10px] text-muted-foreground">DISC típico</div>
          </div>
          <div className="bg-muted/50 rounded p-1.5">
            <div className="text-xs font-medium capitalize">
              {generation.neuroProfile.dominantBrain.substring(0, 4)}
            </div>
            <div className="text-[10px] text-muted-foreground">Cérebro</div>
          </div>
        </div>

        {/* Top Recommendations */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-blue-500" />
            <span className="text-xs text-muted-foreground">
              {generation.preferredChannels[0]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="h-3 w-3 text-green-500" />
            <span className="text-xs text-muted-foreground">
              {generation.effectiveTriggers[0]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span className="text-xs text-muted-foreground">
              Evitar: {generation.ineffectiveTriggers[0]}
            </span>
          </div>
        </div>

        {/* Estilo de Comunicação */}
        <p className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2">
          "{generation.communicationStyle}"
        </p>
      </CardContent>
    </Card>
  );
}

export default GenerationalQuickPanel;
