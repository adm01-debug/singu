import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Clock,
  Shield,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useClosingScore } from '@/hooks/useClosingScore';
import { cn } from '@/lib/utils';

const probabilityConfig = {
  high: {
    label: 'Alta',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    icon: CheckCircle,
    description: 'Cliente pronto para fechamento'
  },
  medium: {
    label: 'Média',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: Minus,
    description: 'Necessita mais trabalho em alguns pontos'
  },
  low: {
    label: 'Baixa',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: AlertTriangle,
    description: 'Recomendado nurturing antes de tentar fechar'
  },
  very_low: {
    label: 'Muito Baixa',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
    icon: XCircle,
    description: 'Foco em construir relacionamento'
  }
};

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
};

interface ClosingScorePanelProps {
  contactId: string;
  contactName?: string;
  className?: string;
  compact?: boolean;
}

export function ClosingScorePanel({ contactId, contactName, className, compact = false }: ClosingScorePanelProps) {
  const { score, loading, analyzing, recalculate } = useClosingScore(contactId, contactName);
  const [showFactors, setShowFactors] = useState(!compact);
  const [showRecommendations, setShowRecommendations] = useState(!compact);

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-24 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-8 text-center">
          <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Sem dados suficientes para calcular o score
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = probabilityConfig[score.probability];
  const ProbIcon = config.icon;

  // Compact view
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className={cn("overflow-hidden", config.borderColor)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Score Circle */}
              <div className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center",
                config.bgColor
              )}>
                <span className={cn("text-2xl font-bold", config.color)}>
                  {score.overallScore}
                </span>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/20"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={`${(score.overallScore / 100) * 176} 176`}
                    className={config.color}
                  />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">Score de Fechamento</h3>
                  <Badge className={cn("text-xs", config.bgColor, config.color)}>
                    <ProbIcon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {score.nextBestAction}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {score.optimalClosingWindow}
                  </span>
                </div>
              </div>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="icon"
                onClick={recalculate}
                disabled={analyzing}
                className="shrink-0"
              >
                <RefreshCw className={cn("w-4 h-4", analyzing && "animate-spin")} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Full view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className={cn("overflow-hidden", config.borderColor)}>
        <CardHeader className={cn("pb-3", config.bgColor)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className={cn("w-5 h-5", config.color)} />
              Score de Fechamento IA
            </CardTitle>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      {score.confidenceLevel}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Nível de confiança baseado na quantidade de dados</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="sm"
                onClick={recalculate}
                disabled={analyzing}
              >
                <RefreshCw className={cn("w-4 h-4", analyzing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Main Score Display */}
          <div className="flex items-center gap-6 py-4">
            {/* Big Score Circle */}
            <div className="relative">
              <div className={cn(
                "w-28 h-28 rounded-full flex items-center justify-center",
                config.bgColor
              )}>
                <div className="text-center">
                  <span className={cn("text-4xl font-bold", config.color)}>
                    {score.overallScore}
                  </span>
                  <p className="text-xs text-muted-foreground">/ 100</p>
                </div>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-muted/20"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={`${(score.overallScore / 100) * 314} 314`}
                  strokeLinecap="round"
                  className={config.color}
                />
              </svg>
            </div>

            {/* Probability & Window */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ProbIcon className={cn("w-5 h-5", config.color)} />
                  <span className={cn("font-semibold text-lg", config.color)}>
                    Probabilidade {config.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">Janela Ideal:</span>
                  <span className="text-muted-foreground">{score.optimalClosingWindow}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Next Best Action */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Próxima Melhor Ação</h4>
                <p className="text-sm text-muted-foreground">
                  {score.nextBestAction}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1 text-success">
                <CheckCircle className="w-4 h-4" />
                Pontos Fortes
              </h4>
              {score.strengths.length > 0 ? (
                <ul className="space-y-1">
                  {score.strengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-success mt-0.5">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Nenhum ponto forte identificado ainda
                </p>
              )}
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-1 text-destructive">
                <XCircle className="w-4 h-4" />
                Pontos a Melhorar
              </h4>
              {score.weaknesses.length > 0 ? (
                <ul className="space-y-1">
                  {score.weaknesses.map((w, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-destructive mt-0.5">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Nenhuma fraqueza crítica
                </p>
              )}
            </div>
          </div>

          {/* Risk Factors */}
          {score.riskFactors.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <h4 className="text-sm font-semibold flex items-center gap-1 text-destructive mb-2">
                <AlertTriangle className="w-4 h-4" />
                Fatores de Risco
              </h4>
              <div className="flex flex-wrap gap-2">
                {score.riskFactors.map((risk, idx) => (
                  <Badge key={idx} variant="outline" className="border-destructive/30 text-destructive text-xs">
                    {risk}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Factors Breakdown */}
          <div>
            <button
              onClick={() => setShowFactors(!showFactors)}
              className="flex items-center justify-between w-full text-left mb-3"
            >
              <h4 className="text-sm font-semibold flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-primary" />
                Análise por Fator
              </h4>
              {showFactors ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {showFactors && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {score.factors.map((factor, idx) => {
                    const TrendIcon = trendIcons[factor.trend];
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{factor.name}</span>
                            <TrendIcon className={cn(
                              "w-3 h-3",
                              factor.trend === 'up' ? 'text-success' :
                              factor.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                            )} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-semibold",
                              factor.score >= 70 ? 'text-success' :
                              factor.score >= 40 ? 'text-warning' : 'text-destructive'
                            )}>
                              {factor.score}%
                            </span>
                            <span className="text-xs text-muted-foreground">
                              (peso: {Math.round(factor.weight * 100)}%)
                            </span>
                          </div>
                        </div>
                        <Progress 
                          value={factor.score} 
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          {factor.description}
                        </p>
                        {factor.recommendation && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {factor.recommendation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
