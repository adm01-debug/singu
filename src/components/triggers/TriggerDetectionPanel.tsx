// ==============================================
// TRIGGER DETECTION PANEL - Real-time Analysis UI
// Displays automatic trigger detection results
// ==============================================

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, Target, AlertTriangle, CheckCircle2, 
  TrendingUp, Zap, Eye, EyeOff, Lightbulb,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTriggerAutoDetection } from '@/hooks/useTriggerAutoDetection';
import { cn } from '@/lib/utils';

interface TriggerDetectionPanelProps {
  text: string;
  className?: string;
  compact?: boolean;
}

const TRIGGER_LABELS: Record<string, string> = {
  // Base Triggers (TriggerType)
  scarcity: 'Escassez',
  urgency: 'Urgência',
  fomo: 'FOMO',
  exclusivity: 'Exclusividade',
  social_proof: 'Prova Social',
  authority: 'Autoridade',
  consensus: 'Consenso',
  testimonial: 'Depoimentos',
  storytelling: 'Storytelling',
  belonging: 'Pertencimento',
  anticipation: 'Antecipação',
  empathy: 'Empatia',
  specificity: 'Especificidade',
  reason_why: 'Razão/Porquê',
  comparison: 'Comparação',
  guarantee: 'Garantia',
  gift: 'Presente/Valor',
  concession: 'Concessão',
  personalization: 'Personalização',
  commitment: 'Compromisso',
  consistency: 'Consistência',
  small_yes: 'Pequenos Sins',
  public_commitment: 'Compromisso Público',
  // Advanced Triggers (AdvancedTriggerType)
  future_pacing: 'Future Pacing',
  pattern_interrupt: 'Quebra Padrão',
  nested_loops: 'Loops Aninhados',
  paradox_double_bind: 'Duplo Vínculo',
  loss_aversion: 'Aversão à Perda',
  identity_shift: 'Mudança Identidade',
  tribal_belonging: 'Pertencimento Tribal',
  cognitive_ease: 'Facilidade Cognitiva',
  priming: 'Priming',
  anchoring: 'Ancoragem',
  decoy_effect: 'Efeito Isca',
  framing: 'Enquadramento',
  curiosity_gap: 'Lacuna Curiosidade',
  peak_end_rule: 'Regra Pico-Fim',
  endowment_effect: 'Efeito Posse',
  sunk_cost: 'Custo Afundado',
  bandwagon: 'Efeito Manada',
  halo_effect: 'Efeito Halo',
  contrast_principle: 'Contraste',
  unity: 'Unidade'
};

const EFFECTIVENESS_CONFIG = {
  low: { color: 'text-red-500', bg: 'bg-red-500/10', label: 'Baixa', icon: AlertTriangle },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Média', icon: TrendingUp },
  high: { color: 'text-green-500', bg: 'bg-green-500/10', label: 'Alta', icon: CheckCircle2 },
  excellent: { color: 'text-primary', bg: 'bg-primary/10', label: 'Excelente', icon: Zap }
};

export function TriggerDetectionPanel({ text, className, compact = false }: TriggerDetectionPanelProps) {
  const { detectTriggers, getEffectivenessScore, getRecommendations } = useTriggerAutoDetection();
  const [showDetails, setShowDetails] = useState(!compact);
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);

  const analysis = useMemo(() => detectTriggers(text), [text, detectTriggers]);
  const effectivenessScore = useMemo(() => getEffectivenessScore(analysis), [analysis, getEffectivenessScore]);
  const recommendations = useMemo(() => getRecommendations(analysis), [analysis, getRecommendations]);

  const effectivenessConfig = EFFECTIVENESS_CONFIG[analysis.effectiveness];
  const EffectivenessIcon = effectivenessConfig.icon;

  const handleCopyContext = (context: string, triggerId: string) => {
    navigator.clipboard.writeText(context);
    setCopiedTrigger(triggerId);
    setTimeout(() => setCopiedTrigger(null), 2000);
  };

  if (!text || text.length < 20) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Radar className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Digite mais texto para análise automática de gatilhos</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radar className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Detecção de Gatilhos</span>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.detectedTriggers.length} detectados
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", effectivenessConfig.bg, effectivenessConfig.color)}>
                    <EffectivenessIcon className="w-3 h-3 mr-1" />
                    {effectivenessConfig.label}
                  </Badge>
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <TriggerList 
                triggers={analysis.detectedTriggers} 
                onCopy={handleCopyContext}
                copiedTrigger={copiedTrigger}
              />
              {recommendations.length > 0 && (
                <RecommendationsList recommendations={recommendations} />
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radar className="w-5 h-5 text-primary" />
            Análise de Gatilhos Mentais
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Overview */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-accent/50">
            <div className="text-2xl font-bold text-primary">{analysis.detectedTriggers.length}</div>
            <div className="text-xs text-muted-foreground">Detectados</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/50">
            <div className={cn("text-2xl font-bold", effectivenessConfig.color)}>
              {effectivenessScore}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/50">
            <div className="text-2xl font-bold">{analysis.triggerDensity}</div>
            <div className="text-xs text-muted-foreground">Densidade</div>
          </div>
        </div>

        {/* Effectiveness Badge */}
        <div className={cn("flex items-center gap-2 p-3 rounded-lg", effectivenessConfig.bg)}>
          <EffectivenessIcon className={cn("w-5 h-5", effectivenessConfig.color)} />
          <span className={cn("font-medium", effectivenessConfig.color)}>
            Efetividade {effectivenessConfig.label}
          </span>
          <Progress 
            value={effectivenessScore} 
            className="flex-1 h-2"
          />
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Dominant Triggers */}
              {analysis.dominantTriggers.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Gatilhos Dominantes
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.dominantTriggers.map(trigger => (
                      <Badge key={trigger} variant="default" className="bg-primary">
                        {TRIGGER_LABELS[trigger] || trigger}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* All Detected Triggers */}
              <TriggerList 
                triggers={analysis.detectedTriggers} 
                onCopy={handleCopyContext}
                copiedTrigger={copiedTrigger}
              />

              {/* Suggestions */}
              {(analysis.suggestions.missing.length > 0 || 
                analysis.suggestions.overused.length > 0 || 
                analysis.suggestions.conflicts.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sugestões</h4>
                  
                  {analysis.suggestions.conflicts.length > 0 && (
                    <div className="flex items-start gap-2 p-2 rounded bg-destructive/10">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <div className="text-sm text-destructive">
                        <strong>Conflitos:</strong> {analysis.suggestions.conflicts.map(([a, b]) => 
                          `${TRIGGER_LABELS[a] || a} ↔ ${TRIGGER_LABELS[b] || b}`
                        ).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {analysis.suggestions.missing.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-1">Considere adicionar:</span>
                      {analysis.suggestions.missing.map(trigger => (
                        <Badge key={trigger} variant="outline" className="text-xs">
                          {TRIGGER_LABELS[trigger] || trigger}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <RecommendationsList recommendations={recommendations} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function TriggerList({ 
  triggers, 
  onCopy, 
  copiedTrigger 
}: { 
  triggers: ReturnType<ReturnType<typeof useTriggerAutoDetection>['detectTriggers']>['detectedTriggers'];
  onCopy: (context: string, id: string) => void;
  copiedTrigger: string | null;
}) {
  if (triggers.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Gatilhos Detectados</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {triggers.map((trigger, idx) => (
          <motion.div
            key={`${trigger.triggerId}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-2 rounded-lg bg-accent/30 border border-accent"
          >
            <div className="flex items-center justify-between mb-1">
              <Badge variant="secondary" className="text-xs">
                {TRIGGER_LABELS[trigger.triggerId] || trigger.triggerId}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {trigger.confidence}% confiança
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onCopy(trigger.context, trigger.triggerId)}
                >
                  {copiedTrigger === trigger.triggerId ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              "...{trigger.context}..."
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {trigger.matchedPatterns.slice(0, 3).map((pattern, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  {pattern}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RecommendationsList({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-primary" />
        Recomendações
      </h4>
      <div className="space-y-1">
        {recommendations.map((rec, idx) => (
          <p key={idx} className="text-xs text-muted-foreground pl-2 border-l-2 border-primary/50">
            {rec}
          </p>
        ))}
      </div>
    </div>
  );
}

export default TriggerDetectionPanel;
