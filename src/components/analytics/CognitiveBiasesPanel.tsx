import { useState } from 'react';
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
  Eye
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
import { CognitiveBiasType, BiasCategory, DetectedBias } from '@/types/cognitive-biases';
import { COGNITIVE_BIAS_INFO, BIAS_CATEGORY_INFO } from '@/data/cognitiveBiasesData';
import { Contact } from '@/types';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'biases' | 'strategies'>('overview');
  const [expandedBias, setExpandedBias] = useState<CognitiveBiasType | null>(null);
  
  const { analysisResult } = useCognitiveBiases(contact, interactions);

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
            </CardTitle>
            <CardDescription>
              Padrões de pensamento detectados
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
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="biases" className="gap-1">
              <Brain className="w-4 h-4" />
              Vieses
            </TabsTrigger>
            <TabsTrigger value="strategies" className="gap-1">
              <Target className="w-4 h-4" />
              Estratégias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
