import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  Target,
  Shield,
  AlertTriangle,
  BarChart3,
  Info,
  Zap,
  Eye,
  History,
  Save,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { useCognitiveBiases } from '@/hooks/useCognitiveBiases';
import { useCognitiveBiasPersistence } from '@/hooks/useCognitiveBiasPersistence';
import { CognitiveBiasType, BiasCategory, DetectedBias } from '@/types/cognitive-biases';
import { COGNITIVE_BIAS_INFO, BIAS_CATEGORY_INFO } from '@/data/cognitiveBiasesData';
import { Contact } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
  createdAt?: string;
}

interface CognitiveBiasesPanelProps {
  contact: Contact;
  interactions: Interaction[];
  className?: string;
}

export function CognitiveBiasesPanel({
  contact,
  interactions,
  className
}: CognitiveBiasesPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'biases' | 'strategies' | 'history'>('overview');
  const [expandedBias, setExpandedBias] = useState<CognitiveBiasType | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  const lastInteractionCountRef = useRef(interactions.length);
  
  const { analysisResult } = useCognitiveBiases(contact, interactions);
  const {
    history,
    isLoading: isLoadingHistory,
    saveAnalysis,
    isSaving,
    evolutionData
  } = useCognitiveBiasPersistence(contact.id);

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

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPolarityColor = (polarity: DetectedBias['polarity']) => {
    switch (polarity) {
      case 'exploitable':
        return 'text-green-600 bg-green-100';
      case 'obstacle':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPolarityIcon = (polarity: DetectedBias['polarity']) => {
    switch (polarity) {
      case 'exploitable':
        return <Zap className="w-3 h-3" />;
      case 'obstacle':
        return <Shield className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  const renderBiasCard = (biasType: CognitiveBiasType, count: number) => {
    const info = COGNITIVE_BIAS_INFO[biasType];
    const isExpanded = expandedBias === biasType;

    return (
      <Collapsible
        key={biasType}
        open={isExpanded}
        onOpenChange={(open) => setExpandedBias(open ? biasType : null)}
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.icon}</span>
                  <div>
                    <h4 className="font-medium">{info.namePt}</h4>
                    <p className="text-xs text-muted-foreground">{info.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {count}x detectado
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {info.descriptionPt}
              </p>
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
                  <div className="p-3 rounded bg-background/50">
                    <h5 className="text-sm font-medium mb-1">📌 Exemplo</h5>
                    <p className="text-sm text-muted-foreground">{info.example}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded bg-green-50 dark:bg-green-950/20">
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Como Usar a Favor
                      </h5>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {info.salesApplication.howToLeverage}
                      </p>
                    </div>

                    <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/20">
                      <h5 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Como Contornar
                      </h5>
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        {info.salesApplication.howToCounter}
                      </p>
                    </div>

                    <div className="p-3 rounded bg-blue-50 dark:bg-blue-950/20">
                      <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Nota Ética
                      </h5>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {info.salesApplication.ethicalNote}
                      </p>
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
            Vieses Cognitivos
          </CardTitle>
          <CardDescription>
            Detecção de padrões de pensamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Sem interações suficientes para análise</p>
            <p className="text-sm">Adicione interações para detectar vieses cognitivos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBiases = analysisResult.detectedBiases.length;
  const uniqueBiases = analysisResult.biasProfile.dominantBiases.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Vieses Cognitivos
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
              Padrões de pensamento detectados
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
                  <div className="text-2xl font-bold text-primary">
                    {uniqueBiases}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    vieses únicos
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{totalBiases} detecções em {interactions.length} interações</p>
                {evolutionData && evolutionData.mostFrequentBiases.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Mais frequente: {COGNITIVE_BIAS_INFO[evolutionData.mostFrequentBiases[0].bias]?.namePt}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="biases" className="gap-1">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">Vieses</span>
            </TabsTrigger>
            <TabsTrigger value="strategies" className="gap-1">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Estratégias</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Evolution Summary */}
            {evolutionData && evolutionData.mostFrequentBiases.length > 0 && (
              <div className="p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Vieses Mais Frequentes (Histórico)
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {evolutionData.mostFrequentBiases.slice(0, 4).map(({ bias, count }) => {
                    const info = COGNITIVE_BIAS_INFO[bias];
                    return (
                      <Badge key={bias} variant="outline" className="gap-1">
                        <span>{info?.icon}</span>
                        {info?.namePt} ({count}x)
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm">{analysisResult.profileSummary}</p>
            </div>

            {/* Category Distribution */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Distribuição por Categoria</h4>
              {(Object.entries(analysisResult.biasProfile.categoryDistribution) as [BiasCategory, number][])
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => {
                  const info = BIAS_CATEGORY_INFO[category];
                  const maxCount = Math.max(...Object.values(analysisResult.biasProfile.categoryDistribution));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-lg w-8">{info.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{info.namePt}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Dominant Biases */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Vieses Dominantes</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResult.biasProfile.dominantBiases.map(bias => {
                  const info = COGNITIVE_BIAS_INFO[bias];
                  return (
                    <Badge
                      key={bias}
                      variant="outline"
                      className={cn('gap-1.5', info.bgColor, info.color)}
                    >
                      <span>{info.icon}</span>
                      {info.namePt}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Quick Insights */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  ⚡ Oportunidades
                </h4>
                <ul className="text-xs space-y-1">
                  {analysisResult.vulnerabilities.slice(0, 3).map(v => (
                    <li key={v.bias} className="flex items-center gap-1">
                      <span>{COGNITIVE_BIAS_INFO[v.bias].icon}</span>
                      {COGNITIVE_BIAS_INFO[v.bias].namePt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-lg border bg-red-50 dark:bg-red-950/20">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  🛡️ Resistências
                </h4>
                <ul className="text-xs space-y-1">
                  {analysisResult.resistances.slice(0, 3).map(r => (
                    <li key={r.bias} className="flex items-center gap-1">
                      <span>{COGNITIVE_BIAS_INFO[r.bias].icon}</span>
                      {COGNITIVE_BIAS_INFO[r.bias].namePt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground flex items-center gap-1">
                <Info className="w-4 h-4" />
                Confiança da análise
              </span>
              <span>{analysisResult.confidence}%</span>
            </div>
          </TabsContent>

          <TabsContent value="biases" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {analysisResult.biasProfile.dominantBiases.map(bias => 
                  renderBiasCard(bias, analysisResult.biasProfile.biasFrequency[bias])
                )}
                
                {analysisResult.biasProfile.dominantBiases.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum viés detectado ainda</p>
                    <p className="text-sm">Continue registrando interações</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4 mt-4">
            {/* Leverage Strategies */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                Estratégias para Usar a Favor
              </h4>
              <ul className="space-y-3">
                {analysisResult.salesStrategies.leverage.map((strategy, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">→</span>
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>

            {/* Counter Strategies */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Estratégias para Contornar
              </h4>
              <ul className="space-y-3">
                {analysisResult.salesStrategies.avoid.map((strategy, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-0.5">→</span>
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ethical Note */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <AlertTriangle className="w-5 h-5" />
                Abordagem Ética
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {analysisResult.salesStrategies.ethical_approach || 
                  'Use o conhecimento de vieses para ajudar o cliente a tomar melhores decisões, não para manipulá-lo.'}
              </p>
            </div>

            {/* Recent Detections */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Detecções Recentes</h4>
              <div className="space-y-2">
                {analysisResult.detectedBiases.slice(0, 5).map(detection => (
                  <div 
                    key={detection.id}
                    className="p-3 rounded border text-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{COGNITIVE_BIAS_INFO[detection.type].icon}</span>
                        <span className="font-medium">
                          {COGNITIVE_BIAS_INFO[detection.type].namePt}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs gap-1', getPolarityColor(detection.polarity))}
                      >
                        {getPolarityIcon(detection.polarity)}
                        {detection.polarity === 'exploitable' ? 'Oportunidade' : 
                         detection.polarity === 'obstacle' ? 'Obstáculo' : 'Neutro'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      "{detection.context}"
                    </p>
                  </div>
                ))}
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
                          <div className="text-2xl font-bold text-primary">
                            {record.dominantBiases.length}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            vieses detectados
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(record.analyzedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {record.dominantBiases.slice(0, 5).map(biasType => {
                          const info = COGNITIVE_BIAS_INFO[biasType];
                          return info ? (
                            <TooltipProvider key={biasType}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="gap-1">
                                    <span>{info.icon}</span>
                                    {info.namePt}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{info.descriptionPt}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : null;
                        })}
                        {record.dominantBiases.length > 5 && (
                          <Badge variant="secondary">
                            +{record.dominantBiases.length - 5}
                          </Badge>
                        )}
                      </div>

                      {/* Category Distribution for this record */}
                      <div className="grid grid-cols-5 gap-1">
                        {(Object.entries(record.categoryDistribution) as [BiasCategory, number][])
                          .map(([category, count]) => {
                            const info = BIAS_CATEGORY_INFO[category];
                            return (
                              <TooltipProvider key={category}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={cn(
                                      'text-center p-1 rounded text-xs',
                                      count > 0 ? info.color.replace('text-', 'bg-').replace('-600', '-100') : 'bg-muted/50'
                                    )}>
                                      <div>{info.icon}</div>
                                      <div className="font-bold">{count}</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{info.namePt}: {count} detecções</p>
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
