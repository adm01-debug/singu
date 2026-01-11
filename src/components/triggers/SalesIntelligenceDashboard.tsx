import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Heart, Handshake, Map, AlertTriangle, FileText, Gamepad2,
  MessageSquareText, BookOpen, ChevronRight, Sparkles, Target, Copy,
  Check, TrendingUp, TrendingDown, Minus, Zap, Shield, Eye, Clock,
  Save, Database, CheckCircle2, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useEmotionalStates } from '@/hooks/useEmotionalStates';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useClientValues } from '@/hooks/useClientValues';
import { useHiddenObjections } from '@/hooks/useHiddenObjections';
import { useSalesScript } from '@/hooks/useSalesScript';
import { useNegotiationSimulator } from '@/hooks/useNegotiationSimulator';
import { usePersuasionScore } from '@/hooks/usePersuasionScore';
import { useClientDictionary } from '@/hooks/useClientDictionary';
import { useEmotionalStatesPersistence } from '@/hooks/useEmotionalStatesPersistence';
import { useClientValuesPersistence } from '@/hooks/useClientValuesPersistence';
import { useHiddenObjectionsPersistence } from '@/hooks/useHiddenObjectionsPersistence';
import { EMOTIONAL_STATE_INFO, VALUE_CATEGORY_INFO, OBJECTION_PATTERNS, SALES_STAGE_INFO } from '@/data/nlpAdvancedData';
import { toast } from 'sonner';

interface SalesIntelligenceDashboardProps {
  contact: Contact;
  interactions: Array<{ id: string; content?: string; transcription?: string; createdAt?: string }>;
  className?: string;
}

export function SalesIntelligenceDashboard({ contact, interactions, className }: SalesIntelligenceDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [messageToAnalyze, setMessageToAnalyze] = useState('');
  const [messageAnalysis, setMessageAnalysis] = useState<any>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('script');
  const [savingEmotions, setSavingEmotions] = useState(false);
  const [savingValues, setSavingValues] = useState(false);
  const [savingObjections, setSavingObjections] = useState(false);

  // Analysis hooks
  const { analyzeEmotionalHistory, detectEmotionalState } = useEmotionalStates();
  const { rapportProfile } = useRapportGenerator(contact);
  const { valuesMap } = useClientValues(contact, interactions);
  const { objectionAnalysis } = useHiddenObjections(interactions);
  const { personalizedScript } = useSalesScript(contact);
  const { simulationResult } = useNegotiationSimulator(contact);
  const { analyzeMessage } = usePersuasionScore(contact);
  const { clientDictionary } = useClientDictionary(contact, interactions);

  // Persistence hooks
  const { 
    persistAnalysis: persistEmotionalAnalysis, 
    stateHistory: savedEmotionalStates,
    positiveAnchors: savedPositiveAnchors,
    negativeAnchors: savedNegativeAnchors,
    loading: loadingEmotions 
  } = useEmotionalStatesPersistence(contact.id);
  
  const { 
    persistValuesMap, 
    savedValues, 
    savedCriteria,
    loading: loadingValues 
  } = useClientValuesPersistence(contact.id);
  
  const { 
    persistObjections, 
    savedObjections,
    resolvedObjections,
    resolveObjection,
    getStats: getObjectionStats,
    loading: loadingObjections 
  } = useHiddenObjectionsPersistence(contact.id);

  const emotionalAnalysis = analyzeEmotionalHistory(interactions);
  const objectionStats = getObjectionStats();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
    toast.success('Copiado!');
  };

  const handleAnalyzeMessage = () => {
    if (!messageToAnalyze.trim()) return;
    const analysis = analyzeMessage(messageToAnalyze);
    setMessageAnalysis(analysis);
  };

  // Save emotional analysis to database
  const handleSaveEmotionalAnalysis = async () => {
    setSavingEmotions(true);
    try {
      const states = emotionalAnalysis.stateHistory.map(s => ({
        state: s.state,
        confidence: 70,
        trigger: s.trigger,
        context: undefined
      }));

      const anchors = [
        ...emotionalAnalysis.positiveAnchors,
        ...emotionalAnalysis.negativeAnchors
      ];

      await persistEmotionalAnalysis(states, anchors);
    } finally {
      setSavingEmotions(false);
    }
  };

  // Save values map to database
  const handleSaveValuesMap = async () => {
    setSavingValues(true);
    try {
      await persistValuesMap(valuesMap.coreValues, valuesMap.decisionCriteria);
    } finally {
      setSavingValues(false);
    }
  };

  // Save objections to database
  const handleSaveObjections = async () => {
    setSavingObjections(true);
    try {
      await persistObjections(objectionAnalysis.detectedObjections);
    } finally {
      setSavingObjections(false);
    }
  };

  const TrendIcon = emotionalAnalysis.emotionalTrend === 'improving' ? TrendingUp :
    emotionalAnalysis.emotionalTrend === 'declining' ? TrendingDown : Minus;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              Raio-X do Cliente - Inteligência de Vendas
            </CardTitle>
            <CardDescription>
              8 módulos PNL avançados para persuasão assertiva
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {personalizedScript.successProbability}% match
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="text-xs py-1.5">Visão Geral</TabsTrigger>
            <TabsTrigger value="emotions" className="text-xs py-1.5">😊 Emoções</TabsTrigger>
            <TabsTrigger value="rapport" className="text-xs py-1.5">🤝 Rapport</TabsTrigger>
            <TabsTrigger value="values" className="text-xs py-1.5">🎯 Valores</TabsTrigger>
            <TabsTrigger value="objections" className="text-xs py-1.5">⚠️ Objeções</TabsTrigger>
            <TabsTrigger value="script" className="text-xs py-1.5">📋 Roteiro</TabsTrigger>
            <TabsTrigger value="simulator" className="text-xs py-1.5">🎮 Simulador</TabsTrigger>
            <TabsTrigger value="analyzer" className="text-xs py-1.5">📊 Analisador</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-xs text-muted-foreground">Estado Emocional</span>
                </div>
                <p className={cn('font-semibold', EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.color)}>
                  {EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.icon} {EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.name}
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <TrendIcon className={cn('w-4 h-4', emotionalAnalysis.emotionalTrend === 'improving' ? 'text-green-500' : emotionalAnalysis.emotionalTrend === 'declining' ? 'text-red-500' : 'text-gray-500')} />
                  <span className="text-xs text-muted-foreground">Tendência</span>
                </div>
                <p className="font-semibold">{emotionalAnalysis.emotionalTrend === 'improving' ? 'Melhorando' : emotionalAnalysis.emotionalTrend === 'declining' ? 'Caindo' : 'Estável'}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Resistência</span>
                </div>
                <p className="font-semibold">{objectionAnalysis.resistanceLevel}%</p>
                <Progress value={objectionAnalysis.resistanceLevel} className="h-1 mt-1" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={cn('w-4 h-4', emotionalAnalysis.bestMomentToClose.recommended ? 'text-green-500' : 'text-orange-500')} />
                  <span className="text-xs text-muted-foreground">Momento p/ Fechar</span>
                </div>
                <p className={cn('font-semibold text-sm', emotionalAnalysis.bestMomentToClose.recommended ? 'text-green-600' : 'text-orange-600')}>
                  {emotionalAnalysis.bestMomentToClose.optimalTiming}
                </p>
              </motion.div>
            </div>

            {/* Key Insights */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Insights Chave para {contact.firstName}
              </h4>
              <ul className="space-y-1 text-sm">
                {personalizedScript.keyInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Values & Dictionary Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Valores Principais
                </h4>
                <div className="flex flex-wrap gap-1">
                  {valuesMap.coreValues.slice(0, 4).map(v => (
                    <Badge key={v.id} variant="secondary" className="text-xs">
                      {VALUE_CATEGORY_INFO[v.category].icon} {v.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg border">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  Palavras Favoritas
                </h4>
                <div className="flex flex-wrap gap-1">
                  {clientDictionary.topEngagementWords.slice(0, 6).map((word, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{word}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* EMOTIONS TAB */}
          <TabsContent value="emotions" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {savedEmotionalStates.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Database className="w-3 h-3" />
                    {savedEmotionalStates.length} estados salvos
                  </Badge>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={handleSaveEmotionalAnalysis} 
                disabled={savingEmotions || loadingEmotions}
                className="gap-1"
              >
                {savingEmotions ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Salvar Análise
              </Button>
            </div>
            <ScrollArea className="h-[360px] pr-4">
              <div className="space-y-4">
                <div className={cn('p-4 rounded-lg border', EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.bgColor)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.icon}</span>
                      <div>
                        <p className="font-semibold">{EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.name}</p>
                        <p className="text-xs text-muted-foreground">{EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-card rounded mt-2">
                    <p className="text-sm"><strong>Abordagem:</strong> {EMOTIONAL_STATE_INFO[emotionalAnalysis.currentState]?.salesApproach}</p>
                  </div>
                </div>

                {emotionalAnalysis.positiveAnchors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-600">✅ Âncoras Positivas (Use!)</h4>
                    <div className="space-y-2">
                      {emotionalAnalysis.positiveAnchors.map(anchor => (
                        <div key={anchor.id} className="p-2 rounded bg-green-50 border border-green-200 text-sm">
                          <strong>"{anchor.trigger}"</strong> - {anchor.context.substring(0, 80)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {emotionalAnalysis.negativeAnchors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-600">⛔ Âncoras Negativas (Evite!)</h4>
                    <div className="space-y-2">
                      {emotionalAnalysis.negativeAnchors.map(anchor => (
                        <div key={anchor.id} className="p-2 rounded bg-red-50 border border-red-200 text-sm">
                          <strong>"{anchor.trigger}"</strong> - {anchor.context.substring(0, 80)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* RAPPORT TAB */}
          <TabsContent value="rapport" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                  <span className="font-medium">Score de Rapport</span>
                  <Badge>{rapportProfile.rapportScore}%</Badge>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">🪞 Scripts de Espelhamento</h4>
                  {rapportProfile.mirroringStrategies.map(script => (
                    <div key={script.id} className="p-3 rounded-lg border mb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{script.title}</p>
                          <p className="text-sm italic mt-1">"{script.script}"</p>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleCopy(script.script, script.id)}>
                          {copiedText === script.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">💬 Frases de Abertura</h4>
                  {rapportProfile.openingLines.map((line, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50 mb-1 flex justify-between items-center">
                      <p className="text-sm">"{line}"</p>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(line, `open-${i}`)}>
                        {copiedText === `open-${i}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-green-50">
                    <h5 className="text-xs font-medium text-green-700 mb-1">✅ Palavras Conexão</h5>
                    <p className="text-xs">{rapportProfile.connectionKeywords.slice(0, 8).join(', ')}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-red-50">
                    <h5 className="text-xs font-medium text-red-700 mb-1">⛔ Evitar</h5>
                    <p className="text-xs">{rapportProfile.avoidKeywords.join(', ')}</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* VALUES TAB */}
          <TabsContent value="values" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {savedValues.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Database className="w-3 h-3" />
                    {savedValues.length} valores salvos
                  </Badge>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={handleSaveValuesMap} 
                disabled={savingValues || loadingValues}
                className="gap-1"
              >
                {savingValues ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Salvar Valores
              </Button>
            </div>
            <ScrollArea className="h-[360px] pr-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">🎯 Hierarquia de Valores</h4>
                  {valuesMap.coreValues.map((value, i) => (
                    <div key={value.id} className="p-3 rounded-lg border mb-2 flex items-center gap-3">
                      <span className="text-2xl">{VALUE_CATEGORY_INFO[value.category].icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{i + 1}º {value.name}</p>
                          <Badge variant="outline">{value.importance}/10</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{VALUE_CATEGORY_INFO[value.category].description}</p>
                        <p className="text-xs text-primary mt-1">{VALUE_CATEGORY_INFO[value.category].benefitFraming}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-green-50">
                    <h5 className="text-xs font-medium text-green-700 mb-2">🚀 Motivadores</h5>
                    {valuesMap.motivationalDrivers.map((d, i) => <p key={i} className="text-xs mb-1">{d}</p>)}
                  </div>
                  <div className="p-3 rounded-lg border bg-amber-50">
                    <h5 className="text-xs font-medium text-amber-700 mb-2">⚠️ Medos</h5>
                    {valuesMap.fearDrivers.map((d, i) => <p key={i} className="text-xs mb-1">{d}</p>)}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* OBJECTIONS TAB */}
          <TabsContent value="objections" className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                {objectionStats.total > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Database className="w-3 h-3" />
                    {objectionStats.pending} pendentes | {objectionStats.resolved} resolvidas
                  </Badge>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={handleSaveObjections} 
                disabled={savingObjections || loadingObjections || objectionAnalysis.detectedObjections.length === 0}
                className="gap-1"
              >
                {savingObjections ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Salvar Objeções
              </Button>
            </div>
            <ScrollArea className="h-[360px] pr-4">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="font-medium text-sm">Nível de Resistência: {objectionAnalysis.resistanceLevel}%</p>
                  <Progress value={objectionAnalysis.resistanceLevel} className="h-2 mt-2" />
                  <p className="text-xs mt-2">{objectionAnalysis.recommendedApproach}</p>
                </div>

                {objectionAnalysis.detectedObjections.map(obj => (
                  <div key={obj.id} className={cn('p-3 rounded-lg border', obj.severity === 'high' ? 'border-red-300 bg-red-50' : obj.severity === 'medium' ? 'border-amber-300 bg-amber-50' : 'border-gray-200')}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{OBJECTION_PATTERNS[obj.type].icon}</span>
                        <span className="font-medium">{OBJECTION_PATTERNS[obj.type].name}</span>
                      </div>
                      <Badge variant={obj.severity === 'high' ? 'destructive' : 'secondary'}>{obj.probability}%</Badge>
                    </div>
                    <p className="text-sm mb-2"><strong>Indicador:</strong> "{obj.indicator}"</p>
                    <p className="text-sm mb-2"><strong>Pergunta para descobrir:</strong></p>
                    <div className="p-2 bg-card rounded flex justify-between items-center">
                      <p className="text-sm italic">"{obj.suggestedProbe}"</p>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(obj.suggestedProbe, obj.id)}>
                        {copiedText === obj.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                ))}

                {objectionAnalysis.detectedObjections.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma objeção oculta detectada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* SCRIPT TAB */}
          <TabsContent value="script" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 whitespace-pre-line text-sm">{personalizedScript.profileSummary}</div>
                
                {personalizedScript.sections.map((section, i) => (
                  <Collapsible key={section.stage} open={expandedSection === section.stage} onOpenChange={() => setExpandedSection(expandedSection === section.stage ? null : section.stage)}>
                    <CollapsibleTrigger asChild>
                      <div className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{SALES_STAGE_INFO[section.stage].icon}</span>
                          <span className="font-medium">{section.title}</span>
                          <Badge variant="outline" className="text-xs">{section.estimatedDuration}</Badge>
                        </div>
                        <ChevronRight className={cn('w-4 h-4 transition-transform', expandedSection === section.stage && 'rotate-90')} />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-4 border-x border-b rounded-b-lg space-y-3">
                        <div className="p-3 bg-muted/50 rounded whitespace-pre-line text-sm">{section.script}</div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Palavras mágicas:</span>
                          {section.magicWords.map((w, j) => <Badge key={j} variant="outline" className="text-xs">{w}</Badge>)}
                        </div>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleCopy(section.script, section.stage)}>
                          {copiedText === section.stage ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar Script
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* SIMULATOR TAB */}
          <TabsContent value="simulator" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-primary/10 border">
                  <p className="font-medium text-sm mb-1">🎯 Abordagem Ideal</p>
                  <p className="text-sm">{simulationResult.optimalPath.approach}</p>
                  <Badge className="mt-2">{simulationResult.optimalPath.successProbability}% chance de sucesso</Badge>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">📋 Sequência Recomendada</h4>
                  {simulationResult.optimalPath.recommendedSequence.map((step, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50 mb-1 text-sm">{step}</div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">🎭 Cenários Previstos</h4>
                  {simulationResult.scenarios.slice(0, 4).map(scenario => (
                    <div key={scenario.id} className="p-3 rounded-lg border mb-2">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-sm">{scenario.name}</p>
                        <Badge variant="outline">{scenario.probability}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground italic mb-2">"{scenario.clientReaction}"</p>
                      <div className="p-2 bg-green-50 rounded">
                        <p className="text-xs"><strong>Resposta:</strong> {scenario.bestResponse}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">✅ Estratégias de Fechamento</h4>
                  {simulationResult.closingStrategies.slice(0, 3).map((strategy, i) => (
                    <div key={i} className="p-2 rounded border mb-1 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{strategy.strategy}</p>
                        <p className="text-xs italic">"{strategy.script}"</p>
                      </div>
                      <Badge variant="secondary">{strategy.effectiveness}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ANALYZER TAB */}
          <TabsContent value="analyzer" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Escreva sua mensagem para analisar:</label>
                <Textarea 
                  placeholder={`Digite aqui a mensagem que você pretende enviar para ${contact.firstName}...`}
                  value={messageToAnalyze}
                  onChange={(e) => setMessageToAnalyze(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleAnalyzeMessage} className="mt-2 gap-2">
                  <MessageSquareText className="w-4 h-4" />
                  Analisar Persuasão
                </Button>
              </div>

              {messageAnalysis && (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3 pr-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border flex items-center justify-between">
                      <span className="font-medium">Score de Persuasão</span>
                      <Badge className="text-lg px-3">{messageAnalysis.overallScore}%</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(messageAnalysis.breakdown).map(([key, value]) => (
                        <div key={key} className="p-2 rounded bg-muted/50 text-center">
                          <p className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="font-bold">{value as number}%</p>
                        </div>
                      ))}
                    </div>

                    {messageAnalysis.strengths.length > 0 && (
                      <div className="p-2 rounded bg-green-50 border border-green-200">
                        <p className="text-xs font-medium text-green-700 mb-1">Pontos Fortes</p>
                        {messageAnalysis.strengths.map((s: string, i: number) => <p key={i} className="text-xs">{s}</p>)}
                      </div>
                    )}

                    {messageAnalysis.missingElements.length > 0 && (
                      <div className="p-2 rounded bg-amber-50 border border-amber-200">
                        <p className="text-xs font-medium text-amber-700 mb-1">Faltando</p>
                        {messageAnalysis.missingElements.map((m: string, i: number) => <p key={i} className="text-xs">• {m}</p>)}
                      </div>
                    )}

                    <div className="p-3 rounded-lg border bg-card">
                      <p className="text-xs font-medium mb-2">✨ Versão Otimizada:</p>
                      <p className="text-sm">{messageAnalysis.optimizedVersion}</p>
                      <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => handleCopy(messageAnalysis.optimizedVersion, 'optimized')}>
                        {copiedText === 'optimized' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
