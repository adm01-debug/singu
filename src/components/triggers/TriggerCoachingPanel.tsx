// ==============================================
// TRIGGER COACHING PANEL - Real-Time Guidance During Sales Interactions
// Provides contextual tips, conflict detection, fallback suggestions
// ==============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Shield,
  MessageSquare,
  RefreshCw,
  Target,
  TrendingUp,
  Clock,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useAdvancedTriggers } from '@/hooks/useAdvancedTriggers';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { MENTAL_TRIGGERS, TriggerType } from '@/types/triggers';
import { AllTriggerTypes, TriggerConflict } from '@/types/triggers-advanced';
import { ADVANCED_MENTAL_TRIGGERS } from '@/data/triggersAdvancedData';
import { EXTENDED_MENTAL_TRIGGERS, ExtendedTriggerType } from '@/data/triggersExtendedData';
import { COMPLETE_TRIGGER_CONFLICTS, COMPLETE_TRIGGER_SYNERGIES } from '@/data/triggerConflictsMatrix';
import { VAK_TRIGGER_TEMPLATES, getVAKTemplatesForTrigger } from '@/data/triggerTemplatesVAK';
import type { VAKType } from '@/types/vak';
import { METAPROGRAM_TRIGGER_TEMPLATES, getMetaprogramTemplatesForTrigger, MetaprogramType } from '@/data/triggerTemplatesMetaprograms';
import { getDominantVAK } from '@/lib/contact-utils';
import { DEMO_CONTACT } from '@/lib/demo-contact';
import { toast } from 'sonner';

interface TriggerCoachingPanelProps {
  contact?: Contact;
  className?: string;
  onTriggerUsed?: (triggerId: string, result: 'success' | 'neutral' | 'failure') => void;
}

interface CoachingAlert {
  id: string;
  type: 'conflict' | 'synergy' | 'fallback' | 'timing' | 'resistance' | 'opportunity';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  suggestion?: string;
  triggerId?: string;
}

interface ActiveSession {
  startedAt: Date;
  triggersUsed: { id: string; usedAt: Date; result?: string }[];
  clientResponses: string[];
  detectedResistance: boolean;
}

export function TriggerCoachingPanel({ 
  contact: contactProp, 
  className,
  onTriggerUsed 
}: TriggerCoachingPanelProps) {
  const contact = contactProp || DEMO_CONTACT;
  const {
    advancedTriggers,
    exposureAnalysis,
    resistanceProfile,
    resistanceScore,
    fullAnalysis,
    recommendedChains,
    getSynergies,
    getFallbacks,
    getRecommendedIntensity,
    detectConflicts,
  } = useAdvancedTriggers(contact);

  const { createUsage, history } = useTriggerHistory(contact.id);

  // Session state
  const [session, setSession] = useState<ActiveSession>({
    startedAt: new Date(),
    triggersUsed: [],
    clientResponses: [],
    detectedResistance: false,
  });
  const [clientResponse, setClientResponse] = useState('');
  const [alerts, setAlerts] = useState<CoachingAlert[]>([]);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Get contact profiles
  const discProfile = contact.behavior?.discProfile || 'I';
  const vakType = getDominantVAK(contact) || 'V';
  const metaprograms = useMemo(() => {
    const behavior = contact.behavior;
    const programs: MetaprogramType[] = [];
    // Infer from behavior data
    if (behavior?.decisionCriteria?.includes('price')) programs.push('away_from');
    if (behavior?.decisionCriteria?.includes('quality')) programs.push('toward');
    if (behavior?.needsApproval === false) programs.push('internal');
    if (behavior?.needsApproval === true) programs.push('external');
    if (behavior?.decisionPower && behavior.decisionPower > 5) programs.push('proactive');
    else programs.push('reactive');
    return programs.length > 0 ? programs : ['toward', 'proactive'] as MetaprogramType[];
  }, [contact.behavior]);

  // Get all triggers combined
  const allTriggers = useMemo(() => ({
    ...MENTAL_TRIGGERS,
    ...ADVANCED_MENTAL_TRIGGERS,
    ...EXTENDED_MENTAL_TRIGGERS,
  }), []);

  // Generate contextual alerts based on session
  useEffect(() => {
    const newAlerts: CoachingAlert[] = [];

    // Check for conflicts with recently used triggers
    if (session.triggersUsed.length >= 2) {
      const recentIds = session.triggersUsed.slice(-3).map(t => t.id) as AllTriggerTypes[];
      const conflicts = detectConflicts(recentIds);
      
      conflicts.forEach(conflict => {
        newAlerts.push({
          id: `conflict-${conflict.trigger1}-${conflict.trigger2}`,
          type: 'conflict',
          severity: conflict.conflictLevel === 'severe' ? 'error' : 'warning',
          title: '⚠️ Conflito Detectado',
          message: `${allTriggers[conflict.trigger1 as keyof typeof allTriggers]?.name} conflita com ${allTriggers[conflict.trigger2 as keyof typeof allTriggers]?.name}`,
          suggestion: conflict.resolution,
        });
      });
    }

    // Check for synergy opportunities
    if (session.triggersUsed.length >= 1) {
      const lastTrigger = session.triggersUsed[session.triggersUsed.length - 1].id as AllTriggerTypes;
      const synergies = getSynergies(lastTrigger).slice(0, 2);
      
      synergies.forEach(synergy => {
        const nextTrigger = synergy.trigger1 === lastTrigger ? synergy.trigger2 : synergy.trigger1;
        if (!session.triggersUsed.some(t => t.id === nextTrigger)) {
          newAlerts.push({
            id: `synergy-${nextTrigger}`,
            type: 'synergy',
            severity: 'success',
            title: '✨ Sinergia Disponível',
            message: `${allTriggers[nextTrigger as keyof typeof allTriggers]?.name} combina bem (${synergy.synergyLevel}/10)`,
            suggestion: synergy.combinedEffect,
            triggerId: nextTrigger,
          });
        }
      });
    }

    // Check for resistance indicators
    if (session.detectedResistance) {
      const lastTrigger = session.triggersUsed[session.triggersUsed.length - 1]?.id as AllTriggerTypes;
      if (lastTrigger) {
        const fallbacks = getFallbacks(lastTrigger);
        if (fallbacks.length > 0) {
          newAlerts.push({
            id: 'fallback-suggestion',
            type: 'fallback',
            severity: 'warning',
            title: '🔄 Resistência Detectada',
            message: 'O cliente mostrou sinais de resistência',
            suggestion: `Considere usar: ${fallbacks.map(f => allTriggers[f.trigger as keyof typeof allTriggers]?.name).slice(0, 2).join(' ou ')}`,
            triggerId: fallbacks[0]?.trigger,
          });
        }
      }
    }

    // Timing recommendations
    if (fullAnalysis?.optimalContactWindow) {
      const now = new Date();
      const currentHour = now.getHours();
      const [startHour, endHour] = fullAnalysis.optimalContactWindow.hourRange;
      
      if (currentHour < startHour || currentHour > endHour) {
        newAlerts.push({
          id: 'timing-suboptimal',
          type: 'timing',
          severity: 'info',
          title: '⏰ Timing',
          message: `Melhor horário: ${startHour}h-${endHour}h`,
          suggestion: fullAnalysis.optimalContactWindow.neurochemicalReason,
        });
      }
    }

    // Saturation warnings
    exposureAnalysis.filter(e => e.saturated).forEach(exposure => {
      newAlerts.push({
        id: `saturation-${exposure.triggerId}`,
        type: 'resistance',
        severity: 'warning',
        title: '🔒 Saturação',
        message: `${allTriggers[exposure.triggerId as keyof typeof allTriggers]?.name} está saturado`,
        suggestion: 'Evite usar esse gatilho por algumas semanas',
      });
    });

    setAlerts(newAlerts);
  }, [session, fullAnalysis, exposureAnalysis, detectConflicts, getSynergies, getFallbacks, allTriggers]);

  // Analyze client response for resistance indicators
  const analyzeClientResponse = useCallback((response: string) => {
    const lowerResponse = response.toLowerCase();
    
    // Resistance indicators
    const resistanceWords = [
      'não sei', 'preciso pensar', 'vou avaliar', 'depois vejo',
      'caro', 'preço', 'orçamento', 'sem budget',
      'não tenho interesse', 'não preciso', 'já tenho',
      'manda por email', 'liga outro dia',
      'manipulação', 'pressão', 'forçando',
    ];
    
    const hasResistance = resistanceWords.some(word => lowerResponse.includes(word));
    
    // Positive indicators
    const positiveWords = [
      'interessante', 'gostei', 'faz sentido', 'conte mais',
      'como funciona', 'qual o próximo passo', 'podemos marcar',
      'envie proposta', 'quanto custa', 'quando começa',
    ];
    
    const hasPositive = positiveWords.some(word => lowerResponse.includes(word));
    
    if (hasResistance && !hasPositive) {
      setSession(prev => ({ ...prev, detectedResistance: true }));
      toast.warning('Resistência detectada na resposta do cliente');
    } else if (hasPositive) {
      setSession(prev => ({ ...prev, detectedResistance: false }));
      toast.success('Resposta positiva detectada! Continue a abordagem.');
    }
    
    setSession(prev => ({
      ...prev,
      clientResponses: [...prev.clientResponses, response],
    }));
    setClientResponse('');
  }, []);

  // Register trigger usage
  const handleTriggerUsed = useCallback(async (triggerId: string) => {
    setSession(prev => ({
      ...prev,
      triggersUsed: [...prev.triggersUsed, { id: triggerId, usedAt: new Date() }],
    }));

    // Log to database
    await createUsage({
      contact_id: contact.id,
      trigger_type: triggerId as TriggerType,
      context: 'Coaching em tempo real',
      result: 'pending',
    });
  }, [contact.id, createUsage]);

  // Get personalized template for trigger
  const getPersonalizedTemplate = useCallback((triggerId: string): string | null => {
    // Try VAK-specific first
    const vakTemplates = getVAKTemplatesForTrigger(triggerId, vakType as VAKType);
    if (vakTemplates.length > 0) {
      return vakTemplates[0].template;
    }

    // Try metaprogram-specific
    const primaryMetaprogram = metaprograms[0];
    if (primaryMetaprogram) {
      const mpTemplates = getMetaprogramTemplatesForTrigger(triggerId, primaryMetaprogram);
      if (mpTemplates.length > 0) {
        return mpTemplates[0].template;
      }
    }

    // Fall back to base trigger examples
    const trigger = allTriggers[triggerId as keyof typeof allTriggers];
    if (trigger && 'examples' in trigger && Array.isArray(trigger.examples)) {
      return trigger.examples[0];
    }

    return null;
  }, [vakType, metaprograms, allTriggers]);

  // Copy template
  const handleCopyTemplate = useCallback((template: string, triggerId: string) => {
    navigator.clipboard.writeText(template.replace(/\{.*?\}/g, '___'));
    setCopiedTemplate(triggerId);
    handleTriggerUsed(triggerId);
    setTimeout(() => setCopiedTemplate(null), 2000);
    toast.success('Template copiado!');
  }, [handleTriggerUsed]);

  // Get next recommended triggers
  const recommendedTriggers = useMemo(() => {
    const used = new Set(session.triggersUsed.map(t => t.id));
    const saturated = new Set(exposureAnalysis.filter(e => e.saturated).map(e => e.triggerId));
    
    // Get from recommended chains
    const fromChains: string[] = [];
    if (recommendedChains.length > 0) {
      const currentChain = recommendedChains[0];
      currentChain.triggers.forEach(t => {
        if (!used.has(t) && !saturated.has(t)) {
          fromChains.push(t);
        }
      });
    }

    // Get from synergies of last used
    const fromSynergies: string[] = [];
    if (session.triggersUsed.length > 0) {
      const lastId = session.triggersUsed[session.triggersUsed.length - 1].id as AllTriggerTypes;
      getSynergies(lastId).forEach(s => {
        const nextId = s.trigger1 === lastId ? s.trigger2 : s.trigger1;
        if (!used.has(nextId) && !saturated.has(nextId)) {
          fromSynergies.push(nextId);
        }
      });
    }

    // Combine and deduplicate
    const all = [...new Set([...fromChains.slice(0, 2), ...fromSynergies.slice(0, 2)])];
    return all.slice(0, 4);
  }, [session.triggersUsed, recommendedChains, exposureAnalysis, getSynergies]);

  return (
    <Card className={cn('border-primary/30', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            Coaching em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Target className="h-3 w-3" />
              DISC: {discProfile}
            </Badge>
            <Badge variant="outline" className="gap-1">
              VAK: {vakType}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Orientação inteligente para {contact.firstName} durante a interação
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resistance Score Indicator */}
        {resistanceScore > 20 && (
          <div className={cn(
            'p-3 rounded-lg border flex items-center gap-3',
            resistanceScore > 70 ? 'bg-destructive/10 border-destructive/30' :
            resistanceScore > 40 ? 'bg-warning/10 border-warning/30' :
            'bg-muted/50'
          )}>
            <Shield className={cn(
              'h-5 w-5',
              resistanceScore > 70 ? 'text-destructive' :
              resistanceScore > 40 ? 'text-warning' : 'text-muted-foreground'
            )} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Nível de Resistência</span>
                <span className="font-bold">{resistanceScore}%</span>
              </div>
              <Progress value={resistanceScore} className="h-1.5 mt-1" />
            </div>
          </div>
        )}

        {/* Active Alerts */}
        <AnimatePresence>
          {alerts.slice(0, 3).map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                'p-3 rounded-lg border flex items-start gap-3',
                alert.severity === 'error' && 'bg-destructive/5 border-destructive/30',
                alert.severity === 'warning' && 'bg-warning/5 border-warning/30',
                alert.severity === 'success' && 'bg-success/5 border-success/30',
                alert.severity === 'info' && 'bg-primary/5 border-primary/30'
              )}
            >
              {alert.type === 'conflict' && <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />}
              {alert.type === 'synergy' && <Sparkles className="h-4 w-4 text-success mt-0.5" />}
              {alert.type === 'fallback' && <RefreshCw className="h-4 w-4 text-warning mt-0.5" />}
              {alert.type === 'timing' && <Clock className="h-4 w-4 text-primary mt-0.5" />}
              {alert.type === 'resistance' && <Shield className="h-4 w-4 text-warning mt-0.5" />}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground">{alert.message}</p>
                {alert.suggestion && (
                  <p className="text-xs text-primary mt-1">💡 {alert.suggestion}</p>
                )}
              </div>
              
              {alert.triggerId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const template = getPersonalizedTemplate(alert.triggerId!);
                    if (template) handleCopyTemplate(template, alert.triggerId!);
                  }}
                >
                  Usar
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Recommended Next Triggers */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Próximos Gatilhos Recomendados
          </p>
          <div className="flex flex-wrap gap-2">
            {recommendedTriggers.map((triggerId) => {
              const trigger = allTriggers[triggerId as keyof typeof allTriggers];
              if (!trigger) return null;
              
              const intensity = getRecommendedIntensity(triggerId as AllTriggerTypes);
              
              return (
                <TooltipProvider key={triggerId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'gap-1.5 h-8',
                          session.triggersUsed.some(t => t.id === triggerId) && 'opacity-50'
                        )}
                        onClick={() => {
                          const template = getPersonalizedTemplate(triggerId);
                          if (template) handleCopyTemplate(template, triggerId);
                        }}
                      >
                        <span>{'icon' in trigger ? trigger.icon : '🎯'}</span>
                        <span className="text-xs">{'name' in trigger ? trigger.name : triggerId}</span>
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                          L{intensity}
                        </Badge>
                        {copiedTemplate === triggerId ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-medium">{'name' in trigger ? trigger.name : triggerId}</p>
                      <p className="text-xs text-muted-foreground">
                        {'description' in trigger ? trigger.description : ''}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        Intensidade recomendada: {intensity}/5
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Used Triggers This Session */}
        {session.triggersUsed.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Gatilhos Usados ({session.triggersUsed.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {session.triggersUsed.map((used, idx) => {
                const trigger = allTriggers[used.id as keyof typeof allTriggers];
                return (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    {'icon' in trigger ? trigger.icon : '🎯'} {'name' in trigger ? trigger.name : used.id}
                    {used.result === 'success' && <ThumbsUp className="h-3 w-3 text-success" />}
                    {used.result === 'failure' && <ThumbsDown className="h-3 w-3 text-destructive" />}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Client Response Analysis */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Analisar Resposta do Cliente
          </p>
          <div className="flex gap-2">
            <Textarea
              placeholder="Cole ou digite a resposta do cliente..."
              value={clientResponse}
              onChange={(e) => setClientResponse(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
          <Button 
            size="sm" 
            className="w-full gap-1"
            onClick={() => analyzeClientResponse(clientResponse)}
            disabled={!clientResponse.trim()}
          >
            <Zap className="h-3 w-3" />
            Analisar e Recomendar
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => {
              setSession({
                startedAt: new Date(),
                triggersUsed: [],
                clientResponses: [],
                detectedResistance: false,
              });
              setAlerts([]);
              toast.info('Sessão reiniciada');
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Nova Sessão
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => {
              // Mark last trigger as successful
              if (session.triggersUsed.length > 0) {
                const lastIdx = session.triggersUsed.length - 1;
                setSession(prev => ({
                  ...prev,
                  triggersUsed: prev.triggersUsed.map((t, i) => 
                    i === lastIdx ? { ...t, result: 'success' } : t
                  ),
                }));
                toast.success('Gatilho marcado como sucesso!');
              }
            }}
          >
            <ThumbsUp className="h-3 w-3" />
            Funcionou
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => {
              // Mark last trigger as failed
              if (session.triggersUsed.length > 0) {
                const lastIdx = session.triggersUsed.length - 1;
                setSession(prev => ({
                  ...prev,
                  triggersUsed: prev.triggersUsed.map((t, i) => 
                    i === lastIdx ? { ...t, result: 'failure' } : t
                  ),
                  detectedResistance: true,
                }));
                toast.warning('Gatilho marcado como falha - mostrando alternativas');
              }
            }}
          >
            <ThumbsDown className="h-3 w-3" />
            Resistência
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TriggerCoachingPanel;
