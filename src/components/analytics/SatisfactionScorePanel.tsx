import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles, Target } from 'lucide-react';
import { useSatisfactionScore } from '@/hooks/useSatisfactionScore';
import { Contact, Interaction } from '@/types';

interface SatisfactionScorePanelProps {
  contact: Contact;
  interactions: Interaction[];
}

const levelConfig = {
  very_satisfied: { icon: Smile, color: 'text-success', bg: 'bg-success/10', label: 'Muito Satisfeito' },
  satisfied: { icon: Smile, color: 'text-success/70', bg: 'bg-success/5', label: 'Satisfeito' },
  neutral: { icon: Meh, color: 'text-warning', bg: 'bg-warning/10', label: 'Neutro' },
  unsatisfied: { icon: Frown, color: 'text-destructive/70', bg: 'bg-destructive/5', label: 'Insatisfeito' },
  very_unsatisfied: { icon: Frown, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Muito Insatisfeito' }
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function SatisfactionScorePanel({ contact, interactions }: SatisfactionScorePanelProps) {
  const satisfaction = useSatisfactionScore(contact, interactions);

  if (!satisfaction) return null;

  const config = levelConfig[satisfaction.level];
  const LevelIcon = config.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smile className="h-5 w-5 text-primary" />
              Score de Satisfação
            </CardTitle>
            <Badge variant={satisfaction.trend === 'improving' ? 'default' : satisfaction.trend === 'declining' ? 'destructive' : 'secondary'}>
              {satisfaction.trend === 'improving' ? '📈 Melhorando' : satisfaction.trend === 'declining' ? '📉 Em queda' : '➡️ Estável'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Score */}
          <div className={`p-4 rounded-lg ${config.bg} flex items-center gap-4`}>
            <div className={`p-3 rounded-full ${config.bg}`}>
              <LevelIcon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{satisfaction.overallScore}%</span>
                <TrendIcon trend={satisfaction.trend === 'improving' ? 'up' : satisfaction.trend === 'declining' ? 'down' : 'stable'} />
              </div>
              <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{satisfaction.npsLikelihood}</div>
              <span className="text-xs text-muted-foreground">NPS</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Prob. Retenção</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={satisfaction.retentionProbability} className="h-2 flex-1" />
                <span className="text-sm font-bold">{satisfaction.retentionProbability}%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <Smile className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Indicaria (NPS 0-10)</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={satisfaction.npsLikelihood * 10} className="h-2 flex-1" />
                <span className="text-sm font-bold">{satisfaction.npsLikelihood}/10</span>
              </div>
            </div>
          </div>

          {/* Factors */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Fatores de Satisfação</h4>
            {satisfaction.factors.map((factor, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{factor.name}</span>
                    <TrendIcon trend={factor.trend} />
                    <span className="text-xs text-muted-foreground">({Math.round(factor.weight * 100)}%)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{factor.details}</span>
                </div>
                <div className="w-20 text-right">
                  <Progress value={factor.score} className="h-1.5" />
                  <span className="text-xs font-medium">{factor.score}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Risk Indicators */}
          {satisfaction.riskIndicators.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Indicadores de Risco</span>
              </div>
              <ul className="space-y-1">
                {satisfaction.riskIndicators.map((risk, idx) => (
                  <li key={idx} className="text-sm text-destructive/80">• {risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {satisfaction.opportunities.length > 0 && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Oportunidades</span>
              </div>
              <ul className="space-y-1">
                {satisfaction.opportunities.map((opp, idx) => (
                  <li key={idx} className="text-sm text-success/80">• {opp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Recomendações</span>
            </div>
            <ul className="space-y-1">
              {satisfaction.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
