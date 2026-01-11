import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Eye,
  Ear,
  Hand,
  Target,
  Shield,
  Compass,
  Users,
  GitBranch,
  List,
  Globe,
  Search,
  Rocket,
  Clock,
  Link,
  Sparkles,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Copy,
  Check,
  TrendingUp,
  Zap,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile, DISC_LABELS } from '@/types';
import { VAKType, VAKProfile, VAK_LABELS, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { 
  MetaprogramProfile, 
  METAPROGRAM_LABELS,
  MotivationDirection,
  ReferenceFrame,
  WorkingStyle,
  ChunkSize,
  ActionFilter,
  ComparisonStyle
} from '@/types/metaprograms';
import { useVAKAnalysis } from '@/hooks/useVAKAnalysis';
import { useMetaprogramAnalysis } from '@/hooks/useMetaprogramAnalysis';
import { toast } from 'sonner';

interface UnifiedNLPDashboardProps {
  contact: Contact;
  interactions: Array<{ id: string; content: string; transcription?: string }>;
  className?: string;
}

type MetaprogramType = 'motivation' | 'reference' | 'working' | 'chunk' | 'action' | 'comparison';
type MetaprogramValue = MotivationDirection | ReferenceFrame | WorkingStyle | ChunkSize | ActionFilter | ComparisonStyle;

const VAK_ICONS: Record<VAKType, typeof Eye> = {
  V: Eye,
  A: Ear,
  K: Hand,
  D: Brain,
};

export function UnifiedNLPDashboard({ 
  contact, 
  interactions,
  className 
}: UnifiedNLPDashboardProps) {
  const [vakProfile, setVakProfile] = useState<VAKProfile | null>(null);
  const [metaProfile, setMetaProfile] = useState<MetaprogramProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [copiedTip, setCopiedTip] = useState<string | null>(null);

  const { 
    getContactVAKProfile, 
    analyzeContactInteractions: analyzeVAK 
  } = useVAKAnalysis();
  
  const { 
    getContactMetaprogramProfile, 
    analyzeContactInteractions: analyzeMetaprograms 
  } = useMetaprogramAnalysis();

  useEffect(() => {
    loadProfiles();
  }, [contact.id]);

  const loadProfiles = async () => {
    setLoading(true);
    const [vak, meta] = await Promise.all([
      getContactVAKProfile(contact.id),
      getContactMetaprogramProfile(contact.id)
    ]);
    setVakProfile(vak);
    setMetaProfile(meta);
    setLoading(false);
  };

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    try {
      await Promise.all([
        analyzeVAK(contact.id),
        analyzeMetaprograms(contact.id, interactions)
      ]);
      await loadProfiles();
      toast.success('Análise PNL concluída!', {
        description: 'Perfis VAK, DISC e Metaprogramas atualizados.'
      });
    } catch (error) {
      toast.error('Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTip(id);
    setTimeout(() => setCopiedTip(null), 2000);
  };

  // Calculate overall NLP score
  const calculateNLPScore = () => {
    let score = 0;
    let factors = 0;

    if (vakProfile?.primary) {
      score += vakProfile.confidence;
      factors++;
    }
    if (metaProfile?.overallConfidence) {
      score += metaProfile.overallConfidence;
      factors++;
    }
    if (contact.behavior?.discProfile) {
      score += contact.behavior.discConfidence || 50;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const hasAnyProfile = vakProfile || metaProfile || contact.behavior?.discProfile;

  const getMetaprogramIcon = (type: MetaprogramType, value: MetaprogramValue): React.ReactNode => {
    switch (type) {
      case 'motivation':
        return value === 'toward' ? <Target className="h-4 w-4" /> : <Shield className="h-4 w-4" />;
      case 'reference':
        return value === 'internal' ? <Compass className="h-4 w-4" /> : <Users className="h-4 w-4" />;
      case 'working':
        return value === 'options' ? <GitBranch className="h-4 w-4" /> : <List className="h-4 w-4" />;
      case 'chunk':
        return value === 'general' ? <Globe className="h-4 w-4" /> : <Search className="h-4 w-4" />;
      case 'action':
        return value === 'proactive' ? <Rocket className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
      case 'comparison':
        return value === 'sameness' ? <Link className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 w-full bg-muted rounded" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              Dashboard Unificado de PNL
            </CardTitle>
            <CardDescription>
              VAK • DISC • Metaprogramas • Sleight of Mouth
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleAnalyzeAll}
            disabled={analyzing || interactions.length === 0}
            className="gap-1.5"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', analyzing && 'animate-spin')} />
            {analyzing ? 'Analisando...' : 'Analisar Tudo'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasAnyProfile ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum perfil PNL detectado</p>
            <p className="text-sm mt-1">
              {interactions.length > 0 
                ? `Clique em "Analisar Tudo" para processar ${interactions.length} interações`
                : 'Adicione interações para habilitar a análise'}
            </p>
          </motion.div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="vak">VAK</TabsTrigger>
              <TabsTrigger value="disc">DISC</TabsTrigger>
              <TabsTrigger value="metaprograms">Metaprogramas</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* NLP Score */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Score de Análise PNL</span>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {calculateNLPScore()}%
                  </Badge>
                </div>
                <Progress value={calculateNLPScore()} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  Baseado em {interactions.length} interações analisadas
                </p>
              </motion.div>

              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* VAK Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-sm">Sistema VAK</span>
                  </div>
                  {vakProfile?.primary ? (
                    <div className={cn('p-2 rounded', VAK_LABELS[vakProfile.primary].bgColor)}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{VAK_LABELS[vakProfile.primary].icon}</span>
                        <div>
                          <p className={cn('font-semibold text-sm', VAK_LABELS[vakProfile.primary].color)}>
                            {VAK_LABELS[vakProfile.primary].fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vakProfile.confidence}% confiança
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não analisado</p>
                  )}
                </motion.div>

                {/* DISC Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-sm">Perfil DISC</span>
                  </div>
                  {contact.behavior?.discProfile ? (
                    <div className={cn('p-2 rounded', DISC_LABELS[contact.behavior.discProfile].color)}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">{contact.behavior.discProfile}</span>
                        <div>
                          <p className="font-semibold text-sm">
                            {DISC_LABELS[contact.behavior.discProfile].name}
                          </p>
                          <p className="text-xs opacity-80">
                            {contact.behavior.discConfidence}% confiança
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não definido</p>
                  )}
                </motion.div>

                {/* Metaprograms Summary */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-sm">Metaprogramas</span>
                  </div>
                  {metaProfile ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {METAPROGRAM_LABELS.motivationDirection[metaProfile.motivationDirection].icon}
                          {METAPROGRAM_LABELS.motivationDirection[metaProfile.motivationDirection].name}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {METAPROGRAM_LABELS.referenceFrame[metaProfile.referenceFrame].icon}
                          {METAPROGRAM_LABELS.referenceFrame[metaProfile.referenceFrame].name}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {metaProfile.overallConfidence}% confiança geral
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não analisado</p>
                  )}
                </motion.div>
              </div>

              {/* Quick Communication Tips */}
              <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between h-auto py-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">Dicas Rápidas de Comunicação</span>
                    </div>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-2"
                      >
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2 pr-4">
                            {/* VAK Tips */}
                            {vakProfile?.primary && (
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-xs font-medium flex items-center gap-1 mb-1">
                                  <Eye className="w-3 h-3" /> VAK ({VAK_LABELS[vakProfile.primary].name}):
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {VAK_COMMUNICATION_TIPS[vakProfile.primary].communicationStyle}
                                </p>
                              </div>
                            )}
                            
                            {/* DISC Tips */}
                            {contact.behavior?.discProfile && (
                              <div className="p-2 rounded bg-muted/50">
                                <p className="text-xs font-medium flex items-center gap-1 mb-1">
                                  <Target className="w-3 h-3" /> DISC ({DISC_LABELS[contact.behavior.discProfile].name}):
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {DISC_LABELS[contact.behavior.discProfile].description}
                                </p>
                              </div>
                            )}
                            
                            {/* Metaprogram Tips */}
                            {metaProfile && (
                              <>
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-xs font-medium flex items-center gap-1 mb-1">
                                    <Target className="w-3 h-3" /> Motivação:
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {METAPROGRAM_LABELS.motivationDirection[metaProfile.motivationDirection].communicationTips[0]}
                                  </p>
                                </div>
                                <div className="p-2 rounded bg-muted/50">
                                  <p className="text-xs font-medium flex items-center gap-1 mb-1">
                                    <Compass className="w-3 h-3" /> Referência:
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {METAPROGRAM_LABELS.referenceFrame[metaProfile.referenceFrame].communicationTips[0]}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </ScrollArea>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Collapsible>

              {/* Personalized Message Suggestions */}
              {hasAnyProfile && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Abordagem Recomendada:
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200 italic">
                    {generatePersonalizedApproach(vakProfile, metaProfile, contact)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs text-green-700 dark:text-green-300"
                    onClick={() => copyToClipboard(
                      generatePersonalizedApproach(vakProfile, metaProfile, contact),
                      'approach'
                    )}
                  >
                    {copiedTip === 'approach' ? (
                      <><Check className="w-3 h-3 mr-1" /> Copiado!</>
                    ) : (
                      <><Copy className="w-3 h-3 mr-1" /> Copiar</>
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* VAK Tab */}
            <TabsContent value="vak" className="space-y-4">
              {vakProfile?.primary ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center"
                  >
                    <div className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg border-2',
                      VAK_LABELS[vakProfile.primary].bgColor
                    )}>
                      <span className="text-3xl">{VAK_LABELS[vakProfile.primary].icon}</span>
                      <div>
                        <p className={cn('font-bold text-lg', VAK_LABELS[vakProfile.primary].color)}>
                          {VAK_LABELS[vakProfile.primary].fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sistema Primário • {vakProfile.confidence}% confiança
                        </p>
                      </div>
                      {vakProfile.secondary && (
                        <Badge variant="outline" className="ml-2">
                          + {VAK_LABELS[vakProfile.secondary].name}
                        </Badge>
                      )}
                    </div>
                  </motion.div>

                  <div className="space-y-3">
                    {(['V', 'A', 'K', 'D'] as VAKType[]).map(type => {
                      const Icon = VAK_ICONS[type];
                      const score = {
                        V: vakProfile.scores.visual,
                        A: vakProfile.scores.auditory,
                        K: vakProfile.scores.kinesthetic,
                        D: vakProfile.scores.digital
                      }[type];
                      
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span className="font-medium">{VAK_LABELS[type].name}</span>
                            </div>
                            <span className="text-muted-foreground">{score.toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={score} 
                            className={cn('h-2', vakProfile.primary === type && 'bg-primary/20')}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Palavras a Usar
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {VAK_COMMUNICATION_TIPS[vakProfile.primary].useWords.map(word => (
                        <Badge key={word} variant="secondary" className="text-xs">
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Sistema VAK não analisado</p>
                </div>
              )}
            </TabsContent>

            {/* DISC Tab */}
            <TabsContent value="disc" className="space-y-4">
              {contact.behavior?.discProfile ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center"
                  >
                    <div className={cn(
                      'flex items-center gap-4 px-6 py-4 rounded-lg border-2',
                      DISC_LABELS[contact.behavior.discProfile].color
                    )}>
                      <span className="text-4xl font-bold">{contact.behavior.discProfile}</span>
                      <div>
                        <p className="font-bold text-lg">
                          {DISC_LABELS[contact.behavior.discProfile].name}
                        </p>
                        <p className="text-sm opacity-80">
                          {DISC_LABELS[contact.behavior.discProfile].description}
                        </p>
                        <p className="text-xs mt-1">
                          {contact.behavior.discConfidence}% confiança
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* DISC Characteristics */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['D', 'I', 'S', 'C'] as DISCProfile[]).filter(Boolean).map(profile => (
                      <div 
                        key={profile}
                        className={cn(
                          'p-3 rounded-lg border',
                          profile === contact.behavior?.discProfile 
                            ? DISC_LABELS[profile!].color
                            : 'bg-muted/30'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{profile}</span>
                          <span className="text-sm">{DISC_LABELS[profile!].name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {DISC_LABELS[profile!].description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {contact.behavior.discNotes && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium mb-1">Notas:</p>
                      <p className="text-sm text-muted-foreground">{contact.behavior.discNotes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Perfil DISC não definido</p>
                  <p className="text-sm mt-1">Edite o perfil comportamental do contato</p>
                </div>
              )}
            </TabsContent>

            {/* Metaprograms Tab */}
            <TabsContent value="metaprograms" className="space-y-4">
              {metaProfile ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="text-sm font-medium">Confiança Geral</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={metaProfile.overallConfidence} className="w-24 h-2" />
                      <span className="text-sm font-medium">{metaProfile.overallConfidence}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Motivation */}
                    {renderMetaprogramCard('motivation', metaProfile.motivationDirection, metaProfile.motivationConfidence)}
                    {/* Reference */}
                    {renderMetaprogramCard('reference', metaProfile.referenceFrame, metaProfile.referenceConfidence)}
                    {/* Working */}
                    {renderMetaprogramCard('working', metaProfile.workingStyle, metaProfile.workingConfidence)}
                    {/* Chunk */}
                    {renderMetaprogramCard('chunk', metaProfile.chunkSize, metaProfile.chunkConfidence)}
                    {/* Action */}
                    {renderMetaprogramCard('action', metaProfile.actionFilter, metaProfile.actionConfidence)}
                    {/* Comparison */}
                    {renderMetaprogramCard('comparison', metaProfile.comparisonStyle, metaProfile.comparisonConfidence)}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Metaprogramas não analisados</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );

  function renderMetaprogramCard(
    type: MetaprogramType,
    value: MetaprogramValue,
    confidence: number
  ) {
    const labels = getMetaprogramLabels(type, value);
    const icon = getMetaprogramIcon(type, value);

    return (
      <div className={cn('p-3 rounded-lg border', labels.color)}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{labels.icon}</span>
          <span className="font-semibold text-sm">{labels.name}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {confidence}%
          </Badge>
        </div>
        <p className="text-xs opacity-80 mb-2">{labels.description}</p>
        <Progress value={confidence} className="h-1.5" />
      </div>
    );
  }

  function getMetaprogramLabels(type: MetaprogramType, value: MetaprogramValue) {
    switch (type) {
      case 'motivation':
        return METAPROGRAM_LABELS.motivationDirection[value as MotivationDirection];
      case 'reference':
        return METAPROGRAM_LABELS.referenceFrame[value as ReferenceFrame];
      case 'working':
        return METAPROGRAM_LABELS.workingStyle[value as WorkingStyle];
      case 'chunk':
        return METAPROGRAM_LABELS.chunkSize[value as ChunkSize];
      case 'action':
        return METAPROGRAM_LABELS.actionFilter[value as ActionFilter];
      case 'comparison':
        return METAPROGRAM_LABELS.comparisonStyle[value as ComparisonStyle];
    }
  }
}

function generatePersonalizedApproach(
  vakProfile: VAKProfile | null,
  metaProfile: MetaprogramProfile | null,
  contact: Contact
): string {
  const parts: string[] = [];
  const name = contact.firstName;

  // Start with VAK
  if (vakProfile?.primary) {
    switch (vakProfile.primary) {
      case 'V':
        parts.push(`Use imagens e visualizações ao conversar com ${name}.`);
        break;
      case 'A':
        parts.push(`Prefira ligações e varie o tom de voz ao falar com ${name}.`);
        break;
      case 'K':
        parts.push(`Seja paciente e construa conexão emocional com ${name}.`);
        break;
      case 'D':
        parts.push(`Use dados e fatos ao apresentar propostas para ${name}.`);
        break;
    }
  }

  // Add DISC insight
  if (contact.behavior?.discProfile) {
    switch (contact.behavior.discProfile) {
      case 'D':
        parts.push('Seja direto e focado em resultados.');
        break;
      case 'I':
        parts.push('Seja entusiasta e valorize o relacionamento.');
        break;
      case 'S':
        parts.push('Transmita segurança e não pressione por decisões rápidas.');
        break;
      case 'C':
        parts.push('Forneça detalhes técnicos e documentação.');
        break;
    }
  }

  // Add Metaprogram insight
  if (metaProfile) {
    if (metaProfile.motivationDirection === 'toward') {
      parts.push('Foque em objetivos e ganhos.');
    } else if (metaProfile.motivationDirection === 'away_from') {
      parts.push('Destaque problemas que serão evitados.');
    }

    if (metaProfile.referenceFrame === 'internal') {
      parts.push('Pergunte o que ele(a) acha.');
    } else if (metaProfile.referenceFrame === 'external') {
      parts.push('Apresente casos de sucesso e depoimentos.');
    }
  }

  if (parts.length === 0) {
    return `Analise as interações com ${name} para obter recomendações personalizadas de comunicação.`;
  }

  return parts.join(' ');
}
