import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Eye,
  Ear,
  Hand,
  Calculator,
  Target,
  Shield,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Copy,
  Check,
  RefreshCcw,
  Fingerprint,
  Radar,
  Compass,
  Scale,
  Crosshair,
  MessageCircle,
  Award,
  Activity,
  Layers,
  Crown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { useEmotionalIntelligence } from '@/hooks/useEmotionalIntelligence';
import { useCognitiveBiases } from '@/hooks/useCognitiveBiases';
import { useEmotionalStates } from '@/hooks/useEmotionalStates';
import { useClientValues } from '@/hooks/useClientValues';
import { useHiddenObjections } from '@/hooks/useHiddenObjections';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { DISC_LABELS, Contact, DISCProfile } from '@/types';
import { VAK_LABELS, VAKType, VAKProfile } from '@/types/vak';
import { METAPROGRAM_LABELS, MetaprogramProfile } from '@/types/metaprograms';
import { EQ_PILLAR_INFO } from '@/data/emotionalIntelligenceData';
import { COGNITIVE_BIAS_INFO } from '@/data/cognitiveBiasesData';
import { toast } from '@/hooks/use-toast';

interface UnifiedBehavioralProfilePanelProps {
  contact: Contact;
  interactions: Array<{ id: string; content?: string; transcription?: string; createdAt?: string }>;
  className?: string;
}

interface FrameworkScore {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  score: number;
  maxScore: number;
  confidence: number;
  summary: string;
  insights: string[];
  dataAvailable: boolean;
}

interface CommunicationStrategy {
  approach: string;
  avoid: string;
  tips: string[];
  keyPhrases: string[];
}

export function UnifiedBehavioralProfilePanel({ contact, interactions, className }: UnifiedBehavioralProfilePanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [vakProfile, setVakProfile] = useState<VAKProfile | null>(null);
  const [metaprogramProfile, setMetaprogramProfile] = useState<MetaprogramProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Hooks for all frameworks
  const { getContactVAKProfile, analyzeText: analyzeVAK } = useVAKAnalysis();
  const { getContactMetaprogramProfile } = useMetaprogramAnalysis();
  const { analysisResult: eqResult } = useEmotionalIntelligence(contact, interactions);
  const { analysisResult: biasResult } = useCognitiveBiases(contact, interactions);
  const { analyzeEmotionalHistory } = useEmotionalStates();
  const { valuesMap } = useClientValues(contact, interactions);
  const { objectionAnalysis } = useHiddenObjections(interactions);
  const { rapportProfile } = useRapportGenerator(contact);
  const { analysis: triggerAnalysis, allTemplates } = useClientTriggers(contact);

  // Derived values from hooks
  const emotionalAnalysis = useMemo(() => analyzeEmotionalHistory(interactions), [analyzeEmotionalHistory, interactions]);
  const currentEmotionalState = emotionalAnalysis?.currentState ? { state: emotionalAnalysis.currentState, trigger: emotionalAnalysis.stateHistory[emotionalAnalysis.stateHistory.length - 1]?.trigger, intensity: 'moderate' as const } : null;
  const topValues = valuesMap?.coreValues || [];
  const activeObjections = objectionAnalysis?.detectedObjections || [];
  const rapportScore = rapportProfile?.rapportScore || 0;
  const connectionKeywords = rapportProfile?.connectionKeywords || [];
  const activeTriggers = triggerAnalysis?.primaryTriggers || [];
  const matchingTemplates = allTemplates?.slice(0, 5) || [];

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

  // Calculate overall behavioral score (0-100)
  const overallScore = useMemo(() => {
    let totalScore = 0;
    let totalWeight = 0;

    // DISC (weight: 15)
    if (contact.behavior?.discProfile) {
      totalScore += (contact.behavior.discConfidence || 50) * 0.15;
      totalWeight += 15;
    }

    // VAK (weight: 15)
    if (vakProfile?.primary) {
      totalScore += (vakProfile.confidence || 50) * 0.15;
      totalWeight += 15;
    }

    // Metaprograms (weight: 15)
    if (metaprogramProfile) {
      totalScore += (metaprogramProfile.overallConfidence || 50) * 0.15;
      totalWeight += 15;
    }

    // EQ (weight: 15)
    if (eqResult.indicators.length > 0) {
      totalScore += eqResult.confidence * 0.15;
      totalWeight += 15;
    }

    // Cognitive Biases (weight: 10)
    if (biasResult.detectedBiases.length > 0) {
      totalScore += biasResult.confidence * 0.10;
      totalWeight += 10;
    }

    // Emotional States (weight: 10)
    if (currentEmotionalState) {
      totalScore += 70 * 0.10; // Presence indicates good data
      totalWeight += 10;
    }

    // Values (weight: 10)
    if (topValues.length > 0) {
      totalScore += Math.min(100, topValues.length * 25) * 0.10;
      totalWeight += 10;
    }

    // Hidden Objections (weight: 5)
    if (activeObjections.length > 0) {
      totalScore += 60 * 0.05;
      totalWeight += 5;
    }

    // Rapport (weight: 5)
    if (rapportScore > 0) {
      totalScore += rapportScore * 0.05;
      totalWeight += 5;
    }

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }, [contact.behavior, vakProfile, metaprogramProfile, eqResult, biasResult, currentEmotionalState, topValues, activeObjections, rapportScore]);

  // Framework scores for radar chart
  const frameworkScores: FrameworkScore[] = useMemo(() => {
    const discProfile = contact.behavior?.discProfile as DISCProfile;
    const discInfo = discProfile ? DISC_LABELS[discProfile] : null;

    return [
      {
        id: 'disc',
        name: 'DISC',
        icon: <Users className="w-4 h-4" />,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        score: contact.behavior?.discConfidence || 0,
        maxScore: 100,
        confidence: contact.behavior?.discConfidence || 0,
        summary: discInfo ? `${discInfo.name}: ${discInfo.description}` : 'Não identificado',
        insights: discInfo ? [
          discProfile === 'D' ? 'Valoriza resultados e autonomia' : '',
          discProfile === 'I' ? 'Valoriza reconhecimento e entusiasmo' : '',
          discProfile === 'S' ? 'Valoriza estabilidade e segurança' : '',
          discProfile === 'C' ? 'Valoriza precisão e qualidade' : '',
        ].filter(Boolean) : [],
        dataAvailable: !!discProfile,
      },
      {
        id: 'vak',
        name: 'VAK (PNL)',
        icon: vakProfile?.primary === 'V' ? <Eye className="w-4 h-4" /> : 
              vakProfile?.primary === 'A' ? <Ear className="w-4 h-4" /> : 
              vakProfile?.primary === 'K' ? <Hand className="w-4 h-4" /> : 
              <Calculator className="w-4 h-4" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        score: vakProfile?.confidence || 0,
        maxScore: 100,
        confidence: vakProfile?.confidence || 0,
        summary: vakProfile?.primary ? `${VAK_LABELS[vakProfile.primary].name}: ${VAK_LABELS[vakProfile.primary].description}` : 'Não identificado',
        insights: vakProfile?.primary ? [
          vakProfile.primary === 'V' ? 'Use recursos visuais e imagens' : '',
          vakProfile.primary === 'A' ? 'Prefira ligações e conversas' : '',
          vakProfile.primary === 'K' ? 'Demonstre empatia e conexão' : '',
          vakProfile.primary === 'D' ? 'Apresente dados e análises' : '',
        ].filter(Boolean) : [],
        dataAvailable: !!vakProfile?.primary,
      },
      {
        id: 'metaprograms',
        name: 'Metaprogramas',
        icon: <Brain className="w-4 h-4" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
        score: metaprogramProfile?.overallConfidence || 0,
        maxScore: 100,
        confidence: metaprogramProfile?.overallConfidence || 0,
        summary: metaprogramProfile ? 
          `${METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection]?.name} | ${METAPROGRAM_LABELS.referenceFrame[metaprogramProfile.referenceFrame]?.name}` : 
          'Não identificado',
        insights: metaprogramProfile ? [
          metaprogramProfile.motivationDirection === 'toward' ? 'Motivado por ganhos e conquistas' : 'Motivado por evitar problemas',
          metaprogramProfile.referenceFrame === 'internal' ? 'Confia no próprio julgamento' : 'Valoriza validação externa',
        ] : [],
        dataAvailable: !!metaprogramProfile,
      },
      {
        id: 'triggers',
        name: 'Gatilhos Mentais',
        icon: <Zap className="w-4 h-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        score: activeTriggers.length > 0 ? Math.min(100, activeTriggers.length * 20) : 0,
        maxScore: 100,
        confidence: activeTriggers.length > 0 ? 70 : 0,
        summary: activeTriggers.length > 0 ? 
          `${activeTriggers.length} gatilho(s) ativo(s)` : 
          'Nenhum gatilho identificado',
        insights: activeTriggers.slice(0, 2).map(t => t.trigger.name),
        dataAvailable: activeTriggers.length > 0,
      },
      {
        id: 'sleight',
        name: 'Sleight of Mouth',
        icon: <MessageCircle className="w-4 h-4" />,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100',
        score: matchingTemplates.length > 0 ? Math.min(100, matchingTemplates.length * 15) : 0,
        maxScore: 100,
        confidence: matchingTemplates.length > 0 ? 65 : 0,
        summary: matchingTemplates.length > 0 ? 
          `${matchingTemplates.length} template(s) disponível(is)` : 
          'Nenhum template específico',
        insights: matchingTemplates.slice(0, 2).map(t => t.title),
        dataAvailable: matchingTemplates.length > 0,
      },
      {
        id: 'emotional-states',
        name: 'Estados Emocionais',
        icon: <Activity className="w-4 h-4" />,
        color: 'text-rose-600',
        bgColor: 'bg-rose-100',
        score: currentEmotionalState ? 80 : 0,
        maxScore: 100,
        confidence: currentEmotionalState ? 75 : 0,
        summary: currentEmotionalState ? 
          `Estado atual: ${currentEmotionalState.state}` : 
          'Estado não identificado',
        insights: currentEmotionalState ? [
          `Intensidade: ${currentEmotionalState.intensity || 'moderada'}`,
          currentEmotionalState.trigger ? `Gatilho: ${currentEmotionalState.trigger}` : '',
        ].filter(Boolean) : [],
        dataAvailable: !!currentEmotionalState,
      },
      {
        id: 'values',
        name: 'Valores & Critérios',
        icon: <Compass className="w-4 h-4" />,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        score: topValues.length > 0 ? Math.min(100, topValues.length * 25) : 0,
        maxScore: 100,
        confidence: topValues.length > 0 ? 70 : 0,
        summary: topValues.length > 0 ? 
          `${topValues.length} valor(es) identificado(s)` : 
          'Valores não identificados',
        insights: topValues.slice(0, 3).map(v => v.name || String(v)),
        dataAvailable: topValues.length > 0,
      },
      {
        id: 'rapport',
        name: 'Rapport',
        icon: <Heart className="w-4 h-4" />,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
        score: rapportScore,
        maxScore: 100,
        confidence: rapportScore > 0 ? 75 : 0,
        summary: rapportScore > 70 ? 'Excelente conexão' : 
                 rapportScore > 40 ? 'Conexão moderada' : 
                 rapportScore > 0 ? 'Conexão em desenvolvimento' : 
                 'Sem dados de rapport',
        insights: connectionKeywords.slice(0, 3),
        dataAvailable: rapportScore > 0,
      },
      {
        id: 'eq',
        name: 'Inteligência Emocional',
        icon: <Award className="w-4 h-4" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        score: eqResult.overallScore,
        maxScore: 100,
        confidence: eqResult.confidence,
        summary: eqResult.profileSummary?.slice(0, 80) + '...' || 'Análise pendente',
        insights: eqResult.strengths?.slice(0, 2).map(s => EQ_PILLAR_INFO[s]?.namePt || s) || [],
        dataAvailable: eqResult.indicators.length > 0,
      },
      {
        id: 'biases',
        name: 'Vieses Cognitivos',
        icon: <Lightbulb className="w-4 h-4" />,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        score: biasResult.confidence,
        maxScore: 100,
        confidence: biasResult.confidence,
        summary: biasResult.biasProfile.dominantBiases.length > 0 ?
          `Dominantes: ${biasResult.biasProfile.dominantBiases.slice(0, 2).map(b => COGNITIVE_BIAS_INFO[b]?.namePt).join(', ')}` :
          'Nenhum viés dominante',
        insights: biasResult.vulnerabilities.slice(0, 2).map(v => COGNITIVE_BIAS_INFO[v.bias]?.namePt || v.bias),
        dataAvailable: biasResult.detectedBiases.length > 0,
      },
    ];
  }, [contact.behavior, vakProfile, metaprogramProfile, eqResult, biasResult, currentEmotionalState, topValues, activeTriggers, matchingTemplates, rapportScore, connectionKeywords]);

  // Generate unified communication strategy
  const communicationStrategy: CommunicationStrategy = useMemo(() => {
    const discProfile = contact.behavior?.discProfile as DISCProfile;
    const approach: string[] = [];
    const avoid: string[] = [];
    const tips: string[] = [];
    const keyPhrases: string[] = [];

    // DISC-based approach
    if (discProfile === 'D') {
      approach.push('Seja direto e objetivo');
      avoid.push('Enrolação e detalhes desnecessários');
      keyPhrases.push('Resultados', 'Eficiência', 'Direto ao ponto');
    } else if (discProfile === 'I') {
      approach.push('Seja entusiasta e relacional');
      avoid.push('Frieza e excesso de dados');
      keyPhrases.push('Parceria', 'Juntos', 'Incrível');
    } else if (discProfile === 'S') {
      approach.push('Seja paciente e tranquilizador');
      avoid.push('Pressão e mudanças bruscas');
      keyPhrases.push('Segurança', 'Confiança', 'Estabilidade');
    } else if (discProfile === 'C') {
      approach.push('Seja preciso e detalhado');
      avoid.push('Superficialidade e informalidade');
      keyPhrases.push('Dados', 'Análise', 'Qualidade');
    }

    // VAK-based tips
    if (vakProfile?.primary === 'V') {
      tips.push('Use recursos visuais, gráficos e apresentações');
      keyPhrases.push('Veja', 'Imagine', 'Visualize');
    } else if (vakProfile?.primary === 'A') {
      tips.push('Prefira ligações e reuniões, varie o tom de voz');
      keyPhrases.push('Escute', 'Soa bem', 'Harmonia');
    } else if (vakProfile?.primary === 'K') {
      tips.push('Seja caloroso, demonstre empatia e conexão');
      keyPhrases.push('Sinta', 'Confortável', 'Experiência');
    } else if (vakProfile?.primary === 'D') {
      tips.push('Apresente dados, estatísticas e análises lógicas');
      keyPhrases.push('Lógico', 'Faz sentido', 'Racional');
    }

    // Metaprogram-based tips
    if (metaprogramProfile?.motivationDirection === 'toward') {
      tips.push('Foque nos benefícios e ganhos');
    } else if (metaprogramProfile?.motivationDirection === 'away_from') {
      tips.push('Destaque riscos e problemas que resolve');
    }

    if (metaprogramProfile?.referenceFrame === 'internal') {
      tips.push('Respeite a autonomia de decisão');
    } else if (metaprogramProfile?.referenceFrame === 'external') {
      tips.push('Forneça provas sociais e referências');
    }

    // EQ-based tips
    if (eqResult.salesImplications.persuasionApproach) {
      tips.push(eqResult.salesImplications.persuasionApproach);
    }

    // Add connection keywords
    connectionKeywords.slice(0, 3).forEach(kw => {
      if (!keyPhrases.includes(kw)) {
        keyPhrases.push(kw);
      }
    });

    return {
      approach: approach.join('. ') || 'Adapte-se ao contexto',
      avoid: avoid.join('. ') || 'Evite assumir preferências',
      tips: tips.slice(0, 5),
      keyPhrases: keyPhrases.slice(0, 8),
    };
  }, [contact.behavior, vakProfile, metaprogramProfile, eqResult, connectionKeywords]);

  // Copy to clipboard
  const copyProfileSummary = () => {
    const summary = `
PERFIL COMPORTAMENTAL: ${contact.firstName} ${contact.lastName}
Score Geral: ${overallScore}%

═══ FRAMEWORKS IDENTIFICADOS ═══
${frameworkScores.filter(f => f.dataAvailable).map(f => `• ${f.name}: ${f.summary}`).join('\n')}

═══ ESTRATÉGIA DE COMUNICAÇÃO ═══
✓ Abordagem: ${communicationStrategy.approach}
✗ Evitar: ${communicationStrategy.avoid}

Dicas:
${communicationStrategy.tips.map(t => `• ${t}`).join('\n')}

Palavras-chave: ${communicationStrategy.keyPhrases.join(', ')}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({ title: 'Copiado!', description: 'Resumo copiado para a área de transferência' });
    setTimeout(() => setCopied(false), 2000);
  };

  const activeFrameworks = frameworkScores.filter(f => f.dataAvailable).length;
  const scoreLevel = overallScore >= 80 ? 'Excelente' : overallScore >= 60 ? 'Bom' : overallScore >= 40 ? 'Moderado' : 'Básico';
  const scoreLevelColor = overallScore >= 80 ? 'text-success' : overallScore >= 60 ? 'text-primary' : overallScore >= 40 ? 'text-warning' : 'text-muted-foreground';

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCcw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Fingerprint className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Perfil Comportamental Unificado
                  <Badge variant="secondary" className="text-xs">
                    {activeFrameworks}/10 Frameworks
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Análise consolidada de todos os 10 frameworks comportamentais
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={copyProfileSummary}>
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>

          {/* Overall Score */}
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Completude do Perfil</span>
                <span className={`font-bold ${scoreLevelColor}`}>
                  {overallScore}% - {scoreLevel}
                </span>
              </div>
              <Progress value={overallScore} className="h-2" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 p-0 h-auto">
              <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Radar className="w-4 h-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="frameworks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Layers className="w-4 h-4 mr-2" />
                10 Frameworks
              </TabsTrigger>
              <TabsTrigger value="strategy" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Target className="w-4 h-4 mr-2" />
                Estratégia
              </TabsTrigger>
              <TabsTrigger value="vulnerabilities" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3">
                <Shield className="w-4 h-4 mr-2" />
                Oportunidades
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-4 m-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {frameworkScores.map((framework, idx) => (
                  <motion.div
                    key={framework.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`p-3 rounded-lg border text-center transition-all hover:shadow-md ${
                              framework.dataAvailable 
                                ? `${framework.bgColor} border-current/20` 
                                : 'bg-muted/30 border-dashed'
                            }`}
                          >
                            <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                              framework.dataAvailable ? framework.bgColor : 'bg-muted'
                            }`}>
                              <span className={framework.dataAvailable ? framework.color : 'text-muted-foreground'}>
                                {framework.icon}
                              </span>
                            </div>
                            <div className="text-xs font-medium truncate">{framework.name}</div>
                            <div className={`text-lg font-bold ${framework.dataAvailable ? framework.color : 'text-muted-foreground'}`}>
                              {framework.dataAvailable ? `${framework.score}%` : '-'}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="font-medium">{framework.name}</p>
                          <p className="text-xs text-muted-foreground">{framework.summary}</p>
                          {framework.insights.length > 0 && (
                            <ul className="text-xs mt-1">
                              {framework.insights.map((insight, i) => (
                                <li key={i}>• {insight}</li>
                              ))}
                            </ul>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </motion.div>
                ))}
              </div>

              {/* Quick Summary */}
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Resumo Executivo
                </h4>
                <p className="text-sm text-muted-foreground">
                  {contact.firstName} apresenta um perfil comportamental com {activeFrameworks} frameworks identificados. 
                  {contact.behavior?.discProfile && ` Perfil DISC ${DISC_LABELS[contact.behavior.discProfile]?.name}.`}
                  {vakProfile?.primary && ` Sistema representacional ${VAK_LABELS[vakProfile.primary]?.name}.`}
                  {eqResult.overallScore > 50 && ` Inteligência emocional ${eqResult.overallLevel === 'high' ? 'alta' : 'moderada'}.`}
                </p>
              </div>
            </TabsContent>

            {/* Frameworks Tab */}
            <TabsContent value="frameworks" className="m-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-3">
                  {frameworkScores.map((framework, idx) => (
                    <motion.div
                      key={framework.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`p-3 rounded-lg border ${framework.dataAvailable ? 'bg-card' : 'bg-muted/20 border-dashed'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${framework.bgColor}`}>
                            <span className={framework.color}>{framework.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{framework.name}</span>
                              {framework.dataAvailable && (
                                <Badge variant="outline" className={`text-xs ${framework.color}`}>
                                  {framework.confidence}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {framework.summary}
                            </p>
                          </div>
                        </div>
                        <div className={`text-right ${framework.dataAvailable ? '' : 'opacity-50'}`}>
                          <div className={`text-lg font-bold ${framework.color}`}>
                            {framework.dataAvailable ? framework.score : 0}%
                          </div>
                        </div>
                      </div>
                      {framework.insights.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-1">
                            {framework.insights.map((insight, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {insight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="p-4 m-0">
              <div className="space-y-4">
                {/* Approach & Avoid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="font-medium text-sm">Abordagem Ideal</span>
                    </div>
                    <p className="text-sm">{communicationStrategy.approach}</p>
                  </div>
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="font-medium text-sm">Evitar</span>
                    </div>
                    <p className="text-sm">{communicationStrategy.avoid}</p>
                  </div>
                </div>

                {/* Tips */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Dicas de Comunicação
                  </h4>
                  <div className="space-y-2">
                    {communicationStrategy.tips.map((tip, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key Phrases */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary" />
                    Palavras-Chave para Usar
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {communicationStrategy.keyPhrases.map((phrase, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Vulnerabilities Tab */}
            <TabsContent value="vulnerabilities" className="p-4 m-0">
              <div className="space-y-4">
                {/* Exploitable Biases */}
                {biasResult.vulnerabilities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Vieses Exploráveis (Oportunidades)
                    </h4>
                    <div className="space-y-2">
                      {biasResult.vulnerabilities.slice(0, 3).map((vuln, i) => (
                        <div key={i} className="p-3 bg-success/5 rounded-lg border border-success/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {COGNITIVE_BIAS_INFO[vuln.bias]?.namePt || vuln.bias}
                            </span>
                            <Badge variant="outline" className="text-success text-xs">
                              {vuln.strength}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {COGNITIVE_BIAS_INFO[vuln.bias]?.salesApplication.howToLeverage}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resistances */}
                {biasResult.resistances.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      Resistências (Obstáculos)
                    </h4>
                    <div className="space-y-2">
                      {biasResult.resistances.slice(0, 3).map((res, i) => (
                        <div key={i} className="p-3 bg-warning/5 rounded-lg border border-warning/20">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {COGNITIVE_BIAS_INFO[res.bias]?.namePt || res.bias}
                            </span>
                            <Badge variant="outline" className="text-warning text-xs">
                              {res.strength}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {COGNITIVE_BIAS_INFO[res.bias]?.salesApplication.howToCounter}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden Objections */}
                {activeObjections.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-destructive" />
                      Objeções Ocultas Detectadas
                    </h4>
                    <div className="space-y-2">
                      {activeObjections.slice(0, 3).map((obj, i) => (
                        <div key={i} className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                          <span className="font-medium text-sm">{obj.possibleRealObjection || obj.type}</span>
                          {obj.suggestedProbe && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Sugestão: {obj.suggestedProbe}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {biasResult.vulnerabilities.length === 0 && 
                 biasResult.resistances.length === 0 && 
                 activeObjections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Adicione mais interações para identificar oportunidades e obstáculos</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
