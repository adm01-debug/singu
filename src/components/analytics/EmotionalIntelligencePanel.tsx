import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  Target,
  MessageSquare,
  Info,
  BarChart3,
  Heart,
  History,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { createEITabWithHistoryHandler, EITabWithHistory } from '@/lib/tab-utils';
import { useEmotionalIntelligence } from '@/hooks/useEmotionalIntelligence';
import { useEQPersistence } from '@/hooks/useEQPersistence';
import { EQPillar, EQPillarScore } from '@/types/emotional-intelligence';
import { EQ_PILLAR_INFO, EQ_LEVEL_INFO } from '@/data/emotionalIntelligenceData';
import { Contact } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
  createdAt?: string;
}

interface EmotionalIntelligencePanelProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function EmotionalIntelligencePanel({
  contact,
  interactions,
  className
}: EmotionalIntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'pillars' | 'sales' | 'history'>('overview');
  const [expandedPillar, setExpandedPillar] = useState<EQPillar | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const lastInteractionCountRef = useRef(interactions.length);
  
  const { analysisResult } = useEmotionalIntelligence(contact, interactions);
  const { 
    history, 
    isLoading: isLoadingHistory, 
    saveAnalysis, 
    isSaving,
    evolutionData 
  } = useEQPersistence(contact.id);

  // Auto-save when new interactions are detected
  useEffect(() => {
    if (
      analysisResult && 
      interactions.length > 0 && 
      interactions.length !== lastInteractionCountRef.current
    ) {
      lastInteractionCountRef.current = interactions.length;
      
      // Save the new analysis
      saveAnalysis(analysisResult);
      setAutoSaved(true);
      
      // Reset the auto-saved indicator after 3 seconds
      const timer = setTimeout(() => setAutoSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [interactions.length, analysisResult, saveAnalysis]);

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLevelColor = (score: number) => {
    if (score >= 86) return 'text-purple-600';
    if (score >= 66) return 'text-green-600';
    if (score >= 46) return 'text-yellow-600';
    if (score >= 26) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 86) return 'bg-purple-500';
    if (score >= 66) return 'bg-green-500';
    if (score >= 46) return 'bg-yellow-500';
    if (score >= 26) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const renderPillarCard = (pillar: EQPillar, pillarScore: EQPillarScore) => {
    const info = EQ_PILLAR_INFO[pillar];
    const isExpanded = expandedPillar === pillar;

    return (
      <Collapsible
        key={pillar}
        open={isExpanded}
        onOpenChange={(open) => setExpandedPillar(open ? pillar : null)}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'border rounded-lg p-4 transition-all hover:shadow-md',
            info.bgColor
          )}
        >
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <h4 className="font-medium">{info.namePt}</h4>
                    <p className="text-xs text-muted-foreground">{info.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(getLevelColor(pillarScore.score))}>
                    {pillarScore.score}%
                  </Badge>
                  {getTrendIcon(pillarScore.trend)}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Progress 
                  value={pillarScore.score} 
                  className="h-2"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {EQ_LEVEL_INFO[pillarScore.level].namePt}
                  </span>
                  <span>
                    +{pillarScore.positiveIndicators} / -{pillarScore.negativeIndicators} indicadores
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t space-y-4"
                >
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4" />
                      Insights
                    </h5>
                    <ul className="text-sm space-y-1">
                      {pillarScore.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Recomendações
                    </h5>
                    <ul className="text-sm space-y-1">
                      {pillarScore.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-500">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-background/50">
                      <span className="text-muted-foreground">Características Alto:</span>
                      <ul className="mt-1">
                        {info.characteristics.high.slice(0, 2).map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <span className="text-muted-foreground">Características Baixo:</span>
                      <ul className="mt-1">
                        {info.characteristics.low.slice(0, 2).map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>
    );
  };

  if (!analysisResult || interactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Inteligência Emocional (QE)
          </CardTitle>
          <CardDescription>
            5 Pilares de Daniel Goleman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Sem interações suficientes para análise</p>
            <p className="text-sm">Adicione interações para gerar o perfil de QE</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Inteligência Emocional (QE)
              {autoSaved && (
                <Badge variant="outline" className="text-xs gap-1 text-green-600 border-green-300">
                  <CheckCircle2 className="w-3 h-3" />
                  Salvo
                </Badge>
              )}
              {isSaving && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Save className="w-3 h-3 animate-pulse" />
                  Salvando...
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              5 Pilares de Daniel Goleman
              {history.length > 0 && (
                <span className="ml-2 text-xs">
                  • {history.length} análise{history.length > 1 ? 's' : ''} salva{history.length > 1 ? 's' : ''}
                </span>
              )}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-end">
                  <div className={cn(
                    'text-3xl font-bold',
                    getLevelColor(analysisResult.overallScore)
                  )}>
                    {analysisResult.overallScore}%
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {EQ_LEVEL_INFO[analysisResult.overallLevel].namePt}
                    </Badge>
                    {evolutionData && (
                      <span>{getTrendIcon(evolutionData.trend)}</span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Score geral de Inteligência Emocional</p>
                <p className="text-xs text-muted-foreground">
                  Baseado em {analysisResult.indicators.length} indicadores
                </p>
                {evolutionData && (
                  <p className="text-xs text-muted-foreground">
                    Tendência: {evolutionData.trend === 'improving' ? 'Melhorando' : 
                      evolutionData.trend === 'declining' ? 'Caindo' : 'Estável'}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={createEITabWithHistoryHandler(setActiveTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="pillars" className="gap-1">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Pilares</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Evolution Summary */}
            {evolutionData && evolutionData.history.length > 1 && (
              <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Evolução do QE
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold text-lg">{Math.round(evolutionData.averageScore)}%</div>
                    <div className="text-xs text-muted-foreground">Média</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-green-600">{evolutionData.highestScore}%</div>
                    <div className="text-xs text-muted-foreground">Máximo</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-orange-600">{evolutionData.lowestScore}%</div>
                    <div className="text-xs text-muted-foreground">Mínimo</div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Card */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm">{analysisResult.profileSummary}</p>
            </div>

            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  ✨ Pontos Fortes
                </h4>
                {analysisResult.strengths.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {analysisResult.strengths.map(pillar => (
                      <li key={pillar} className="flex items-center gap-2">
                        <span>{EQ_PILLAR_INFO[pillar].icon}</span>
                        {EQ_PILLAR_INFO[pillar].namePt}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Desenvolvendo todas as áreas
                  </p>
                )}
              </div>

              <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20">
                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                  🌱 Áreas de Crescimento
                </h4>
                {analysisResult.areasForGrowth.length > 0 ? (
                  <ul className="text-sm space-y-1">
                    {analysisResult.areasForGrowth.map(pillar => (
                      <li key={pillar} className="flex items-center gap-2">
                        <span>{EQ_PILLAR_INFO[pillar].icon}</span>
                        {EQ_PILLAR_INFO[pillar].namePt}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Equilíbrio em todas as áreas
                  </p>
                )}
              </div>
            </div>

            {/* Radar-like visualization using bars */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Perfil dos 5 Pilares</h4>
              {(Object.entries(analysisResult.pillarScores) as [EQPillar, EQPillarScore][]).map(
                ([pillar, score]) => (
                  <div key={pillar} className="flex items-center gap-3">
                    <div className="w-8 text-center text-lg">
                      {EQ_PILLAR_INFO[pillar].icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{EQ_PILLAR_INFO[pillar].namePt}</span>
                        <span className={cn('text-sm font-medium', getLevelColor(score.score))}>
                          {score.score}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score.score}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className={cn('h-full rounded-full', getProgressColor(score.score))}
                        />
                      </div>
                    </div>
                    {getTrendIcon(score.trend)}
                  </div>
                )
              )}
            </div>

            {/* Confidence indicator */}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground flex items-center gap-1">
                <Info className="w-4 h-4" />
                Confiança da análise
              </span>
              <span>{analysisResult.confidence}%</span>
            </div>
          </TabsContent>

          <TabsContent value="pillars" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {(Object.entries(analysisResult.pillarScores) as [EQPillar, EQPillarScore][]).map(
                  ([pillar, score]) => renderPillarCard(pillar, score)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🧠 Estilo de Decisão
                </h4>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.salesImplications.decisionMakingStyle}
                </p>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🎯 Abordagem de Persuasão
                </h4>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.salesImplications.persuasionApproach}
                </p>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  🛡️ Manejo de Objeções
                </h4>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.salesImplications.objectionHandling}
                </p>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  ✅ Estratégia de Fechamento
                </h4>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.salesImplications.closingStrategy}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  💬 Dicas de Comunicação
                </h4>
                <ul className="text-sm space-y-2">
                  {analysisResult.communicationStyle.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-1 text-sm">
                  ⚠️ Evitar
                </h4>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {analysisResult.communicationStyle.avoidApproach}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            {isLoadingHistory ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p>Carregando histórico...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma análise salva ainda</p>
                <p className="text-sm">As análises serão salvas automaticamente</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {history.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'text-2xl font-bold',
                            getLevelColor(record.overallScore)
                          )}>
                            {record.overallScore}%
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {record.overallLevel}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(record.analyzedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-2">
                        {(['self_awareness', 'self_regulation', 'motivation', 'empathy', 'social_skills'] as EQPillar[]).map(pillar => {
                          const pillarScore = record.pillarScores[pillar] || 0;
                          const info = EQ_PILLAR_INFO[pillar];
                          return (
                            <TooltipProvider key={pillar}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-center p-2 rounded bg-muted/50">
                                    <div className="text-lg">{info.icon}</div>
                                    <div className={cn(
                                      'text-sm font-bold',
                                      getLevelColor(pillarScore)
                                    )}>
                                      {pillarScore}%
                                    </div>
                                    {evolutionData?.pillarTrends[pillar] && (
                                      <div className="mt-1">
                                        {getTrendIcon(evolutionData.pillarTrends[pillar])}
                                      </div>
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{info.namePt}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                      </div>

                      {record.profileSummary && (
                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {record.profileSummary}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
