import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Lightbulb,
  MessageCircle,
  Shield,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Video,
  Users,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Brain,
  Heart,
  Award,
  Layers,
  ArrowRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useApproachRecommendation, ApproachPhase } from '@/hooks/useApproachRecommendation';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { useEmotionalIntelligence } from '@/hooks/useEmotionalIntelligence';
import { useCognitiveBiases } from '@/hooks/useCognitiveBiases';
import { useEmotionalStates } from '@/hooks/useEmotionalStates';
import { useClientValues } from '@/hooks/useClientValues';
import { useHiddenObjections } from '@/hooks/useHiddenObjections';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { Contact } from '@/types';
import { VAKProfile } from '@/types/vak';
import { MetaprogramProfile } from '@/types/metaprograms';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ApproachRecommendationPanelProps {
  contact: Contact;
  interactions: Array<{ id: string; content?: string; transcription?: string; createdAt?: string }>;
  className?: string;
}

const channelIcons: Record<string, React.ElementType> = {
  'Ligação telefônica': Phone,
  'E-mail detalhado': Mail,
  'Mensagem direta (WhatsApp)': MessageSquare,
  'Reunião presencial': Users,
  'Videochamada': Video,
};

const riskColors = {
  low: 'text-success bg-success/10 border-success/30',
  medium: 'text-warning bg-warning/10 border-warning/30',
  high: 'text-destructive bg-destructive/10 border-destructive/30',
};

const riskLabels = {
  low: 'Baixo Risco',
  medium: 'Risco Moderado',
  high: 'Alto Risco',
};

export function ApproachRecommendationPanel({ contact, interactions, className }: ApproachRecommendationPanelProps) {
  const [activeTab, setActiveTab] = useState('strategy');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['rapport']));
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [vakProfile, setVakProfile] = useState<VAKProfile | null>(null);
  const [metaprogramProfile, setMetaprogramProfile] = useState<MetaprogramProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // All analysis hooks
  const { getContactVAKProfile } = useVAKAnalysis();
  const { getContactMetaprogramProfile } = useMetaprogramAnalysis();
  const { analysisResult: eqResult } = useEmotionalIntelligence(contact, interactions);
  const { analysisResult: biasResult } = useCognitiveBiases(contact, interactions);
  const { analyzeEmotionalHistory } = useEmotionalStates();
  const { valuesMap } = useClientValues(contact, interactions);
  const { objectionAnalysis } = useHiddenObjections(interactions);
  const { rapportProfile } = useRapportGenerator(contact);
  const { analysis: triggerAnalysis } = useClientTriggers(contact);

  // Derived data
  const emotionalAnalysis = useMemo(() => analyzeEmotionalHistory(interactions), [analyzeEmotionalHistory, interactions]);
  const currentEmotionalState = emotionalAnalysis?.currentState || null;
  const topValues = valuesMap?.coreValues || [];
  const rawObjections = objectionAnalysis?.detectedObjections || [];
  const hiddenObjections = rawObjections.map(obj => ({
    objection_type: obj.type || 'unknown',
    indicator: obj.indicator || '',
    suggested_probe: obj.suggestedProbe,
  }));
  const rapportScore = rapportProfile?.rapportScore || 0;
  const activeTriggers = triggerAnalysis?.primaryTriggers || [];

  // Fetch profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const [vak, meta] = await Promise.all([
          getContactVAKProfile(contact.id),
          getContactMetaprogramProfile(contact.id),
        ]);
        setVakProfile(vak);
        setMetaprogramProfile(meta);
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [contact.id, getContactVAKProfile, getContactMetaprogramProfile]);

  // Get recommendation
  const recommendation = useApproachRecommendation({
    contact,
    vakProfile,
    metaprogramProfile,
    eqResult,
    biasResult,
    emotionalState: currentEmotionalState,
    topValues,
    activeTriggers,
    hiddenObjections,
    rapportScore,
  });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { overallStrategy, phases, channels, personalizedMessages, doAndDont, objectionHandling, closingTechniques, urgencyTriggers, trustBuilders, decisionAccelerators, keyMetrics } = recommendation;

  return (
    <TooltipProvider>
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Recomendação de Abordagem
                  <Badge variant="outline" className="ml-2">
                    <Sparkles className="w-3 h-3 mr-1" />
                    IA
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Estratégia personalizada baseada em 10 frameworks comportamentais
                </p>
              </div>
            </div>
          </div>

          {/* Strategy Overview */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-card border shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary text-primary-foreground">
                    {overallStrategy.name}
                  </Badge>
                  <Badge variant="outline" className={cn("border", riskColors[overallStrategy.riskLevel])}>
                    <Shield className="w-3 h-3 mr-1" />
                    {riskLabels[overallStrategy.riskLevel]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {overallStrategy.description}
                </p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {overallStrategy.estimatedSuccessRate}%
                </div>
                <p className="text-xs text-muted-foreground">Taxa de sucesso estimada</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
              {keyMetrics.map((metric, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-lg font-semibold">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">{metric.name}</div>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {metric.impact}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-none border-b bg-muted/30 p-0 h-auto">
              <TabsTrigger value="strategy" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Layers className="w-4 h-4 mr-2" />
                Fases
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <MessageCircle className="w-4 h-4 mr-2" />
                Mensagens
              </TabsTrigger>
              <TabsTrigger value="channels" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Phone className="w-4 h-4 mr-2" />
                Canais
              </TabsTrigger>
              <TabsTrigger value="techniques" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Zap className="w-4 h-4 mr-2" />
                Técnicas
              </TabsTrigger>
              <TabsTrigger value="tips" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Lightbulb className="w-4 h-4 mr-2" />
                Dicas
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px]">
              {/* Strategy Phases Tab */}
              <TabsContent value="strategy" className="p-4 mt-0 space-y-3">
                {phases.map((phase, idx) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    index={idx}
                    isExpanded={expandedPhases.has(phase.id)}
                    onToggle={() => togglePhase(phase.id)}
                    onCopy={(text: string) => copyToClipboard(text, `phase-${phase.id}`)}
                    copiedItem={copiedItem}
                  />
                ))}
              </TabsContent>

              {/* Personalized Messages Tab */}
              <TabsContent value="messages" className="p-4 mt-0 space-y-4">
                <div className="grid gap-4">
                  {personalizedMessages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-xl bg-muted/50 border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Badge variant="outline">{msg.context}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(msg.message, `msg-${idx}`)}
                        >
                          {copiedItem === `msg-${idx}` ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm mb-3 leading-relaxed">"{msg.message}"</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          Tom: {msg.tone}
                        </Badge>
                        {msg.keyPhrases.map((phrase, pidx) => (
                          <Badge key={pidx} variant="outline" className="text-xs">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Separator />

                {/* Objection Handling */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-warning" />
                    Tratamento de Objeções
                  </h4>
                  <div className="space-y-3">
                    {objectionHandling.map((obj, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                        <div className="flex items-start gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{obj.objection}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              ↳ {obj.response}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs mt-2">
                          Técnica: {obj.technique}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Channels Tab */}
              <TabsContent value="channels" className="p-4 mt-0 space-y-4">
                {channels.map((channel, idx) => {
                  const Icon = channelIcons[channel.channel] || MessageCircle;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-xl border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          channel.effectiveness > 85 ? "bg-success/10 text-success" :
                          channel.effectiveness > 70 ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{channel.channel}</h4>
                            <div className="flex items-center gap-2">
                              <Progress value={channel.effectiveness} className="w-20 h-2" />
                              <span className="text-sm font-medium">{channel.effectiveness}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{channel.reason}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Melhor horário: {channel.bestTimeSlot}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {channel.tips.map((tip, tidx) => (
                              <Badge key={tidx} variant="secondary" className="text-xs">
                                {tip}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </TabsContent>

              {/* Techniques Tab */}
              <TabsContent value="techniques" className="p-4 mt-0 space-y-4">
                {/* Closing Techniques */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-primary" />
                    Técnicas de Fechamento
                  </h4>
                  <div className="space-y-3">
                    {closingTechniques.map((tech, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-3 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{tech.technique}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < Math.round(tech.effectiveness / 20) 
                                    ? "text-yellow-500 fill-yellow-500" 
                                    : "text-muted"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">"{tech.script}"</p>
                        <Badge variant="secondary" className="text-xs">
                          Melhor para: {tech.bestFor}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(tech.script, `tech-${idx}`)}
                        >
                          {copiedItem === `tech-${idx}` ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Urgency Triggers */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-warning" />
                    Gatilhos de Urgência
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {urgencyTriggers.map((trigger, idx) => (
                      <Badge key={idx} variant="outline" className="bg-warning/5 border-warning/30">
                        {trigger}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Trust Builders */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Construtores de Confiança
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trustBuilders.map((builder, idx) => (
                      <Badge key={idx} variant="outline" className="bg-pink-500/5 border-pink-500/30">
                        {builder}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Decision Accelerators */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-success" />
                    Aceleradores de Decisão
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {decisionAccelerators.map((acc, idx) => (
                      <Badge key={idx} variant="outline" className="bg-success/5 border-success/30">
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Tips Tab */}
              <TabsContent value="tips" className="p-4 mt-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Do's */}
                  <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <h4 className="font-medium flex items-center gap-2 mb-3 text-success">
                      <ThumbsUp className="w-4 h-4" />
                      Faça
                    </h4>
                    <ul className="space-y-2">
                      {doAndDont.do.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Don'ts */}
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <h4 className="font-medium flex items-center gap-2 mb-3 text-destructive">
                      <ThumbsDown className="w-4 h-4" />
                      Evite
                    </h4>
                    <ul className="space-y-2">
                      {doAndDont.dont.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* Quick Reference */}
                <div className="p-4 rounded-xl bg-muted/50 border">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    Referência Rápida
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Estratégia:</span>
                      <p className="font-medium">{overallStrategy.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Confiança:</span>
                      <p className="font-medium">{overallStrategy.confidence}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Melhor Canal:</span>
                      <p className="font-medium">{channels[0]?.channel}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Melhor Técnica:</span>
                      <p className="font-medium">{closingTechniques[0]?.technique}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// Phase Card Component
function PhaseCard({
  phase,
  index,
  isExpanded,
  onToggle,
  onCopy,
  copiedItem,
}: {
  phase: ApproachPhase;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: (text: string) => void;
  copiedItem: string | null;
}) {
  const phaseColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-emerald-500',
    'bg-orange-500',
    'bg-pink-500',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={cn(
          "rounded-xl border transition-colors",
          isExpanded ? "border-primary/50 bg-primary/5" : "hover:border-primary/30"
        )}>
          <CollapsibleTrigger className="w-full p-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold",
                phaseColors[index % phaseColors.length]
              )}>
                {index + 1}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium flex items-center gap-2">
                  {phase.name}
                  {phase.warnings.length > 0 && (
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  )}
                </h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {phase.timing}
                  </span>
                  <span>•</span>
                  <span>{phase.duration}</span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 space-y-4">
              <Separator />

              {/* Actions */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Ações</h5>
                <ul className="space-y-1">
                  {phase.actions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-1" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Techniques */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Técnicas</h5>
                <div className="flex flex-wrap gap-1">
                  {phase.techniques.map((tech, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Scripts */}
              {phase.scripts.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Scripts Sugeridos</h5>
                  <div className="space-y-2">
                    {phase.scripts.map((script, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                        <p className="text-sm flex-1 italic">"{script}"</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onCopy(script)}
                        >
                          {copiedItem === `phase-${phase.id}` ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {phase.warnings.length > 0 && (
                <div className="p-2 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <div className="text-sm">
                      {phase.warnings.map((warning, idx) => (
                        <p key={idx}>{warning}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Success Indicators */}
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Indicadores de Sucesso</h5>
                <div className="flex flex-wrap gap-1">
                  {phase.successIndicators.map((indicator, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-success/5 border-success/30">
                      <CheckCircle className="w-3 h-3 mr-1 text-success" />
                      {indicator}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}
