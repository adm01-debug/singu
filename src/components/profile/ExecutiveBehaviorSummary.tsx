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
  Info,
  Copy,
  Check,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { useEmotionalIntelligence } from '@/hooks/useEmotionalIntelligence';
import { useCognitiveBiases } from '@/hooks/useCognitiveBiases';
import { DISC_LABELS } from '@/types';
import { VAK_LABELS, VAKType, VAKProfile } from '@/types/vak';
import { METAPROGRAM_LABELS, MetaprogramProfile } from '@/types/metaprograms';
import { EQ_PILLAR_INFO } from '@/data/emotionalIntelligenceData';
import { COGNITIVE_BIAS_INFO } from '@/data/cognitiveBiasesData';
import { Contact, DISCProfile } from '@/types';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ExecutiveBehaviorSummaryProps {
  contact: Contact;
  interactions: Array<{ id: string; content?: string; transcription?: string; createdAt?: string }>;
}

interface ProfileSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  confidence: number;
  summary: string;
  details: React.ReactNode;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const color = confidence >= 70 ? 'text-success' : confidence >= 40 ? 'text-warning' : 'text-muted-foreground';
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs ${color}`}>
            {confidence}%
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confiança da análise: {confidence}%</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionCard({ section, isExpanded, onToggle }: { section: ProfileSection; isExpanded: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className={`border-l-4 ${section.color} transition-shadow hover:shadow-md`}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-muted/50">
                    {section.icon}
                  </div>
                  <CardTitle className="text-sm">{section.title}</CardTitle>
                  <ConfidenceBadge confidence={section.confidence} />
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <p className="text-sm text-muted-foreground text-left">{section.summary}</p>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 border-t border-border mt-2 pt-3">
              {section.details}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}

export function ExecutiveBehaviorSummary({ contact, interactions }: ExecutiveBehaviorSummaryProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [vakProfile, setVakProfile] = useState<VAKProfile | null>(null);
  const [metaprogramProfile, setMetaprogramProfile] = useState<MetaprogramProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { getContactVAKProfile } = useVAKAnalysis();
  const { getContactMetaprogramProfile } = useMetaprogramAnalysis();
  const { analysisResult: eqResult } = useEmotionalIntelligence(contact, interactions);
  const { analysisResult: biasResult } = useCognitiveBiases(contact, interactions);

  // Fetch VAK and Metaprogram profiles
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
        logger.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [contact.id, getContactVAKProfile, getContactMetaprogramProfile]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // DISC Section
  const discProfile = contact.behavior?.discProfile as DISCProfile;
  const discSection: ProfileSection = useMemo(() => {
    const discInfo = discProfile ? DISC_LABELS[discProfile] : null;
    return {
      id: 'disc',
      title: 'Perfil DISC',
      icon: <Users className="w-4 h-4 text-primary" />,
      color: 'border-l-primary',
      confidence: contact.behavior?.discConfidence || 0,
      summary: discInfo 
        ? `${discInfo.name}: ${discInfo.description}`
        : 'Perfil DISC não identificado. Adicione mais interações.',
      details: discInfo ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={discInfo.color}>{discInfo.name}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Abordagem:</span>
              <p className="font-medium">
                {discProfile === 'D' && 'Seja direto e objetivo'}
                {discProfile === 'I' && 'Seja entusiasta e relacional'}
                {discProfile === 'S' && 'Seja paciente e tranquilizador'}
                {discProfile === 'C' && 'Seja preciso e detalhado'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Evite:</span>
              <p className="font-medium">
                {discProfile === 'D' && 'Enrolação e detalhes desnecessários'}
                {discProfile === 'I' && 'Frieza e excesso de dados'}
                {discProfile === 'S' && 'Pressão e mudanças bruscas'}
                {discProfile === 'C' && 'Superficialidade e informalidade'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Análise DISC pendente.</p>
      ),
    };
  }, [discProfile, contact.behavior?.discConfidence]);

  // VAK Section
  const vakSection: ProfileSection = useMemo(() => {
    if (!vakProfile?.primary) {
      return {
        id: 'vak',
        title: 'Sistema Representacional (VAK)',
        icon: <Eye className="w-4 h-4 text-purple-600" />,
        color: 'border-l-purple-500',
        confidence: 0,
        summary: 'Análise VAK pendente. Execute análise de interações.',
        details: <p className="text-sm text-muted-foreground">Clique em "Analisar VAK" para identificar o sistema representacional.</p>,
      };
    }

    const primaryInfo = VAK_LABELS[vakProfile.primary];
    const secondaryInfo = vakProfile.secondary ? VAK_LABELS[vakProfile.secondary] : null;

    const getVakIcon = (type: VAKType) => {
      switch (type) {
        case 'V': return <Eye className="w-4 h-4" />;
        case 'A': return <Ear className="w-4 h-4" />;
        case 'K': return <Hand className="w-4 h-4" />;
        case 'D': return <Calculator className="w-4 h-4" />;
      }
    };

    return {
      id: 'vak',
      title: 'Sistema Representacional (VAK)',
      icon: getVakIcon(vakProfile.primary),
      color: 'border-l-purple-500',
      confidence: vakProfile.confidence,
      summary: `${primaryInfo.name}: ${primaryInfo.description}${secondaryInfo ? ` | Secundário: ${secondaryInfo.name}` : ''}`,
      details: (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {(['V', 'A', 'K', 'D'] as VAKType[]).map(type => {
              const info = VAK_LABELS[type];
              const score = vakProfile.scores[type === 'V' ? 'visual' : type === 'A' ? 'auditory' : type === 'K' ? 'kinesthetic' : 'digital'];
              const isPrimary = vakProfile.primary === type;
              return (
                <div key={type} className={`p-2 rounded-lg text-center ${isPrimary ? info.bgColor : 'bg-muted/30'}`}>
                  <div className="text-xs font-medium">{info.name}</div>
                  <div className="text-lg font-bold">{Math.round(score)}%</div>
                </div>
              );
            })}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Comunicação ideal:</span>
            <p className="font-medium mt-1">
              {vakProfile.primary === 'V' && 'Use imagens, gráficos e apresentações visuais'}
              {vakProfile.primary === 'A' && 'Prefira ligações e reuniões, varie o tom de voz'}
              {vakProfile.primary === 'K' && 'Seja caloroso, demonstre empatia e conexão'}
              {vakProfile.primary === 'D' && 'Apresente dados, estatísticas e análises'}
            </p>
          </div>
        </div>
      ),
    };
  }, [vakProfile]);

  // Metaprogram Section
  const metaprogramSection: ProfileSection = useMemo(() => {
    if (!metaprogramProfile) {
      return {
        id: 'metaprogram',
        title: 'Metaprogramas',
        icon: <Brain className="w-4 h-4 text-emerald-600" />,
        color: 'border-l-emerald-500',
        confidence: 0,
        summary: 'Análise de metaprogramas pendente.',
        details: <p className="text-sm text-muted-foreground">Execute análise de interações para identificar metaprogramas.</p>,
      };
    }

    const motivationLabel = METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection];
    const referenceLabel = METAPROGRAM_LABELS.referenceFrame[metaprogramProfile.referenceFrame];
    const workingLabel = METAPROGRAM_LABELS.workingStyle[metaprogramProfile.workingStyle];

    return {
      id: 'metaprogram',
      title: 'Metaprogramas',
      icon: <Brain className="w-4 h-4 text-emerald-600" />,
      color: 'border-l-emerald-500',
      confidence: metaprogramProfile.overallConfidence,
      summary: `Motivação: ${motivationLabel.name} | Referência: ${referenceLabel.name} | Estilo: ${workingLabel.name}`,
      details: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Motivation */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">Direção Motivacional</span>
                <Badge variant="outline" className={motivationLabel.color}>{motivationLabel.icon} {motivationLabel.name}</Badge>
              </div>
              <p className="text-xs">{motivationLabel.communicationTips[0]}</p>
            </div>
            {/* Reference */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">Quadro de Referência</span>
                <Badge variant="outline" className={referenceLabel.color}>{referenceLabel.icon} {referenceLabel.name}</Badge>
              </div>
              <p className="text-xs">{referenceLabel.communicationTips[0]}</p>
            </div>
            {/* Working Style */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">Estilo de Trabalho</span>
                <Badge variant="outline" className={workingLabel.color}>{workingLabel.icon} {workingLabel.name}</Badge>
              </div>
              <p className="text-xs">{workingLabel.communicationTips[0]}</p>
            </div>
            {/* Action Filter */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">Filtro de Ação</span>
                <Badge variant="outline" className={METAPROGRAM_LABELS.actionFilter[metaprogramProfile.actionFilter].color}>
                  {METAPROGRAM_LABELS.actionFilter[metaprogramProfile.actionFilter].icon} {METAPROGRAM_LABELS.actionFilter[metaprogramProfile.actionFilter].name}
                </Badge>
              </div>
              <p className="text-xs">{METAPROGRAM_LABELS.actionFilter[metaprogramProfile.actionFilter].communicationTips[0]}</p>
            </div>
          </div>
        </div>
      ),
    };
  }, [metaprogramProfile]);

  // EQ Section
  const eqSection: ProfileSection = useMemo(() => {
    const level = eqResult.overallLevel;
    const levelColors = {
      low: 'text-destructive',
      developing: 'text-warning',
      moderate: 'text-muted-foreground',
      high: 'text-success',
      exceptional: 'text-primary',
    };

    const sortedPillars = Object.entries(eqResult.pillarScores)
      .sort((a, b) => b[1].score - a[1].score);
    const strongestPillar = sortedPillars[0];
    const weakestPillar = sortedPillars[sortedPillars.length - 1];

    return {
      id: 'eq',
      title: 'Inteligência Emocional (EQ)',
      icon: <Heart className="w-4 h-4 text-pink-600" />,
      color: 'border-l-pink-500',
      confidence: eqResult.confidence,
      summary: `Score geral: ${eqResult.overallScore}% | Forte em ${EQ_PILLAR_INFO[strongestPillar[0] as keyof typeof EQ_PILLAR_INFO]?.namePt || strongestPillar[0]}`,
      details: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score Geral</span>
            <div className="flex items-center gap-2">
              <Progress value={eqResult.overallScore} className="w-24 h-2" />
              <span className={`font-bold ${levelColors[level]}`}>{eqResult.overallScore}%</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(eqResult.pillarScores).map(([pillar, data]) => {
              const pillarInfo = EQ_PILLAR_INFO[pillar as keyof typeof EQ_PILLAR_INFO];
              return (
                <TooltipProvider key={pillar}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center p-1.5 rounded bg-muted/30">
                        <div className="text-[10px] text-muted-foreground truncate">{pillarInfo?.namePt?.split(' ')[0] || pillar}</div>
                        <div className="text-sm font-bold">{data.score}%</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{pillarInfo?.namePt}: {data.score}%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Implicação para vendas:</span>
            <p className="font-medium mt-1">{eqResult.salesImplications.persuasionApproach}</p>
          </div>
        </div>
      ),
    };
  }, [eqResult]);

  // Cognitive Biases Section
  const biasSection: ProfileSection = useMemo(() => {
    const dominantBiases = biasResult.biasProfile.dominantBiases.slice(0, 3);
    const vulnerabilities = biasResult.vulnerabilities.slice(0, 2);
    const resistances = biasResult.resistances.slice(0, 2);

    return {
      id: 'biases',
      title: 'Vieses Cognitivos',
      icon: <Lightbulb className="w-4 h-4 text-amber-600" />,
      color: 'border-l-amber-500',
      confidence: biasResult.confidence,
      summary: dominantBiases.length > 0
        ? `Dominantes: ${dominantBiases.map(b => COGNITIVE_BIAS_INFO[b]?.namePt).join(', ')}`
        : 'Nenhum viés dominante identificado ainda.',
      details: (
        <div className="space-y-3">
          {dominantBiases.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground">Vieses dominantes:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {dominantBiases.map(bias => (
                  <Badge key={bias} variant="secondary" className="text-xs">
                    {COGNITIVE_BIAS_INFO[bias]?.namePt || bias}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {vulnerabilities.length > 0 && (
            <div>
              <span className="text-xs text-success flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Oportunidades (exploráveis)
              </span>
              <ul className="text-xs mt-1 space-y-0.5">
                {vulnerabilities.map(v => (
                  <li key={v.bias}>• {COGNITIVE_BIAS_INFO[v.bias]?.salesApplication.howToLeverage.slice(0, 80)}...</li>
                ))}
              </ul>
            </div>
          )}
          {resistances.length > 0 && (
            <div>
              <span className="text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Cuidados (obstáculos)
              </span>
              <ul className="text-xs mt-1 space-y-0.5">
                {resistances.map(r => (
                  <li key={r.bias}>• {COGNITIVE_BIAS_INFO[r.bias]?.salesApplication.howToCounter.slice(0, 80)}...</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    };
  }, [biasResult]);

  const allSections = [discSection, vakSection, metaprogramSection, eqSection, biasSection];

  // Generate executive summary text
  const executiveSummaryText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`📋 RESUMO EXECUTIVO - ${contact.firstName} ${contact.lastName}`);
    lines.push('');
    
    allSections.forEach(section => {
      if (section.confidence > 0) {
        lines.push(`${section.title}: ${section.summary}`);
      }
    });

    lines.push('');
    lines.push('🎯 ABORDAGEM RECOMENDADA:');
    
    // DISC based approach
    if (discProfile && DISC_LABELS[discProfile]) {
      lines.push(`• DISC (${DISC_LABELS[discProfile].name}): ${
        discProfile === 'D' ? 'Seja direto, focado em resultados' :
        discProfile === 'I' ? 'Seja entusiasta, construa rapport' :
        discProfile === 'S' ? 'Seja paciente, transmita segurança' :
        'Seja preciso, apresente dados'
      }`);
    }

    // VAK based approach
    if (vakProfile?.primary) {
      lines.push(`• VAK (${VAK_LABELS[vakProfile.primary].name}): ${
        vakProfile.primary === 'V' ? 'Use visuais e demonstrações' :
        vakProfile.primary === 'A' ? 'Prefira calls e explicações verbais' :
        vakProfile.primary === 'K' ? 'Crie conexão emocional' :
        'Apresente dados e lógica'
      }`);
    }

    // EQ based approach
    lines.push(`• EQ (${eqResult.overallScore}%): ${eqResult.salesImplications.closingStrategy}`);

    return lines.join('\n');
  }, [contact, allSections, discProfile, vakProfile, eqResult]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(executiveSummaryText);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Resumo executivo copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o resumo.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCcw className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando perfis comportamentais...</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall readiness
  const profilesWithData = allSections.filter(s => s.confidence > 0).length;
  const overallConfidence = Math.round(allSections.reduce((sum, s) => sum + s.confidence, 0) / allSections.length);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Resumo Executivo Comportamental
                <Badge variant="outline" className="ml-2">
                  {profilesWithData}/5 perfis
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Consolidação de DISC, VAK, Metaprogramas, EQ e Vieses Cognitivos
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
        
        {/* Overall Confidence Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Maturidade do perfil</span>
            <span className="font-medium">{overallConfidence}%</span>
          </div>
          <Progress value={overallConfidence} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <AnimatePresence>
          {allSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SectionCard
                section={section}
                isExpanded={expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick Action Recommendations */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Ações Rápidas Recomendadas</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-background rounded-lg">
                <span className="text-muted-foreground">Melhor canal:</span>
                <p className="font-medium">
                  {vakProfile?.primary === 'V' ? '📧 Email visual ou apresentação' :
                   vakProfile?.primary === 'A' ? '📞 Ligação telefônica' :
                   vakProfile?.primary === 'K' ? '🤝 Reunião presencial' :
                   '📊 Documento detalhado'}
                </p>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <span className="text-muted-foreground">Tom de comunicação:</span>
                <p className="font-medium">
                  {discProfile === 'D' ? 'Direto e objetivo' :
                   discProfile === 'I' ? 'Entusiasmado e amigável' :
                   discProfile === 'S' ? 'Calmo e acolhedor' :
                   discProfile === 'C' ? 'Formal e preciso' :
                   'Adaptável ao contexto'}
                </p>
              </div>
              <div className="p-2 bg-background rounded-lg">
                <span className="text-muted-foreground">Foco principal:</span>
                <p className="font-medium">
                  {metaprogramProfile?.motivationDirection === 'toward' ? '🎯 Benefícios e ganhos' :
                   metaprogramProfile?.motivationDirection === 'away_from' ? '🛡️ Evitar problemas' :
                   '⚖️ Balancear ganhos e riscos'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
