import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  Eye,
  Ear,
  Hand,
  Target,
  Shield,
  Users,
  Lightbulb,
  Copy,
  Check,
  ChevronRight,
  Zap,
  TrendingUp,
  MessageSquare,
  Star,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { VAKType, VAKProfile } from '@/types/vak';
import { MetaprogramProfile, METAPROGRAM_LABELS } from '@/types/metaprograms';
import { VAK_ADAPTED_TEMPLATES, VAKAdaptedTemplate } from '@/data/vakTemplates';
import { METAPROGRAM_TEMPLATES, MetaprogramTemplate, getAdaptedMessage, combineTemplateMessage } from '@/data/metaprogramTemplates';
import { toast } from 'sonner';

interface ProfileBasedSuggestionsProps {
  contact: Contact;
  vakProfile: VAKProfile | null;
  metaprogramProfile: MetaprogramProfile | null;
  className?: string;
}

interface SuggestedTemplate {
  id: string;
  title: string;
  category: 'vak' | 'metaprogram' | 'combined';
  scenario: string;
  message: string;
  variables: string[];
  matchScore: number;
  matchReasons: string[];
  tips: string[];
  source: 'VAK' | 'Metaprograma' | 'Combinado';
}

const DISC_DESCRIPTIONS: Record<DISCProfile, { name: string; icon: string; color: string }> = {
  D: { name: 'Dominante', icon: '🔴', color: 'bg-destructive text-destructive border-destructive' },
  I: { name: 'Influente', icon: '🟡', color: 'bg-warning text-warning border-warning/30' },
  S: { name: 'Estável', icon: '🟢', color: 'bg-success text-success border-success/30' },
  C: { name: 'Consciente', icon: '🔵', color: 'bg-info text-info border-info' },
};

const VAK_DESCRIPTIONS: Record<VAKType, { name: string; icon: typeof Eye; color: string }> = {
  V: { name: 'Visual', icon: Eye, color: 'bg-info text-info' },
  A: { name: 'Auditivo', icon: Ear, color: 'bg-secondary text-secondary' },
  K: { name: 'Cinestésico', icon: Hand, color: 'bg-accent text-accent' },
  D: { name: 'Digital', icon: Brain, color: 'bg-muted text-muted-foreground' },
};

function TemplatePreviewDialog({
  template,
  contact,
  onCopy,
}: {
  template: SuggestedTemplate;
  contact: Contact;
  onCopy: () => void;
}) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach((v) => {
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa' || v === 'empresa_cliente') initial[v] = contact.companyName || '';
      else initial[v] = '';
    });
    return initial;
  });

  const [copied, setCopied] = useState(false);

  const filledTemplate = template.message.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);

  const allFilled = template.variables.every((v) => variables[v]?.trim());

  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate);
    setCopied(true);
    toast.success('Mensagem copiada!');
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Match reasons */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Por que este template?</span>
        </div>
        <ul className="space-y-1">
          {template.matchReasons.map((reason, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="grid gap-3">
          {template.variables.map((variable) => (
            <div key={variable}>
              <Label htmlFor={variable} className="text-sm capitalize">
                {variable.replace(/_/g, ' ')}
              </Label>
              <Input
                id={variable}
                value={variables[variable] || ''}
                onChange={(e) => setVariables((prev) => ({ ...prev, [variable]: e.target.value }))}
                placeholder={`Digite ${variable.replace(/_/g, ' ')}`}
                className="mt-1"
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea value={filledTemplate} readOnly className="mt-1 h-32 bg-secondary/30" />
      </div>

      {/* Tips */}
      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas de comunicação:</p>
          <ul className="space-y-1">
            {template.tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                • {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={handleCopy} disabled={!allFilled && template.variables.length > 0} className="w-full gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado!' : 'Copiar Mensagem'}
      </Button>
    </div>
  );
}

export function ProfileBasedSuggestions({
  contact,
  vakProfile,
  metaprogramProfile,
  className,
}: ProfileBasedSuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'vak' | 'metaprogram' | 'combined'>('all');

  const discProfile = contact.behavior?.discProfile as DISCProfile | undefined;

  // Generate suggestions based on complete profile
  const suggestions = useMemo<SuggestedTemplate[]>(() => {
    const results: SuggestedTemplate[] = [];

    // 1. Generate VAK-based suggestions
    if (vakProfile?.primary) {
      VAK_ADAPTED_TEMPLATES.forEach((template) => {
        const variation = template.variations.find((v) => v.vakType === vakProfile.primary);
        if (!variation) return;

        let matchScore = 50;
        const matchReasons: string[] = [];

        // VAK match
        matchScore += vakProfile.confidence * 0.3;
        matchReasons.push(
          `Adaptado para perfil ${VAK_DESCRIPTIONS[vakProfile.primary].name} (${vakProfile.confidence.toFixed(0)}% confiança)`
        );

        // DISC match bonus
        if (template.discProfile === null || template.discProfile === discProfile) {
          if (discProfile) {
            matchScore += 15;
            matchReasons.push(`Compatível com perfil DISC ${DISC_DESCRIPTIONS[discProfile].name}`);
          }
        }

        results.push({
          id: `vak-${template.id}`,
          title: template.baseTitle,
          category: 'vak',
          scenario: template.scenario || 'Geral',
          message: variation.template,
          variables: template.variables,
          matchScore,
          matchReasons,
          tips: [...variation.tips, ...template.universalTips],
          source: 'VAK',
        });
      });
    }

    // 2. Generate Metaprogram-based suggestions
    if (metaprogramProfile) {
      METAPROGRAM_TEMPLATES.forEach((template) => {
        const { motivation, reference, working } = getAdaptedMessage(
          template,
          metaprogramProfile.motivationDirection,
          metaprogramProfile.referenceFrame,
          metaprogramProfile.workingStyle
        );

        let matchScore = 40;
        const matchReasons: string[] = [];
        const tips: string[] = [];

        // Motivation match
        if (metaprogramProfile.motivationDirection !== 'balanced') {
          matchScore += metaprogramProfile.motivationConfidence * 0.2;
          const motLabel = METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection];
          matchReasons.push(`Motivação: ${motLabel.name} (${metaprogramProfile.motivationConfidence.toFixed(0)}%)`);
          tips.push(...motLabel.communicationTips.slice(0, 2));
        }

        // Reference match
        if (metaprogramProfile.referenceFrame !== 'balanced') {
          matchScore += metaprogramProfile.referenceConfidence * 0.15;
          const refLabel = METAPROGRAM_LABELS.referenceFrame[metaprogramProfile.referenceFrame];
          matchReasons.push(`Referência: ${refLabel.name} (${metaprogramProfile.referenceConfidence.toFixed(0)}%)`);
          tips.push(...refLabel.communicationTips.slice(0, 1));
        }

        // Working style match
        if (metaprogramProfile.workingStyle !== 'balanced') {
          matchScore += metaprogramProfile.workingConfidence * 0.15;
          const workLabel = METAPROGRAM_LABELS.workingStyle[metaprogramProfile.workingStyle];
          matchReasons.push(`Estilo: ${workLabel.name} (${metaprogramProfile.workingConfidence.toFixed(0)}%)`);
          tips.push(...workLabel.communicationTips.slice(0, 1));
        }

        // Determine primary focus based on highest confidence
        let primaryMessage = motivation;
        let primaryFocus: 'motivation' | 'reference' | 'working' = 'motivation';
        
        if (metaprogramProfile.referenceConfidence > metaprogramProfile.motivationConfidence) {
          primaryMessage = reference;
          primaryFocus = 'reference';
        }
        if (metaprogramProfile.workingConfidence > Math.max(metaprogramProfile.motivationConfidence, metaprogramProfile.referenceConfidence)) {
          primaryMessage = working;
          primaryFocus = 'working';
        }

        results.push({
          id: `meta-${template.id}`,
          title: template.baseTitle,
          category: 'metaprogram',
          scenario: template.scenario,
          message: primaryMessage,
          variables: template.variables,
          matchScore,
          matchReasons,
          tips,
          source: 'Metaprograma',
        });
      });
    }

    // 3. Generate combined suggestions (best of both)
    if (vakProfile?.primary && metaprogramProfile) {
      const combinedTemplates = [
        {
          id: 'combined-approach',
          title: 'Abordagem Inicial Personalizada',
          scenario: 'Primeiro contato adaptado ao perfil completo',
          baseMessage: generateCombinedMessage(vakProfile, metaprogramProfile, discProfile, 'opening'),
        },
        {
          id: 'combined-objection',
          title: 'Resposta a Objeções Personalizada',
          scenario: 'Lidar com resistências usando perfil completo',
          baseMessage: generateCombinedMessage(vakProfile, metaprogramProfile, discProfile, 'objection'),
        },
        {
          id: 'combined-closing',
          title: 'Fechamento Personalizado',
          scenario: 'Momento de decisão adaptado ao perfil',
          baseMessage: generateCombinedMessage(vakProfile, metaprogramProfile, discProfile, 'closing'),
        },
        {
          id: 'combined-followup',
          title: 'Follow-up Personalizado',
          scenario: 'Retomar contato usando preferências do cliente',
          baseMessage: generateCombinedMessage(vakProfile, metaprogramProfile, discProfile, 'followup'),
        },
      ];

      combinedTemplates.forEach((template) => {
        const matchReasons: string[] = [];
        const tips: string[] = [];
        let matchScore = 80;

        // Add all profile-based reasons
        const vakLabel = VAK_DESCRIPTIONS[vakProfile.primary];
        matchReasons.push(`Linguagem ${vakLabel.name} (VAK)`);

        if (metaprogramProfile.motivationDirection !== 'balanced') {
          const motLabel = METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection];
          matchReasons.push(`Motivação ${motLabel.name}`);
          tips.push(motLabel.communicationTips[0]);
        }

        if (discProfile) {
          const discLabel = DISC_DESCRIPTIONS[discProfile];
          matchReasons.push(`Perfil DISC ${discLabel.name}`);
        }

        matchScore += (vakProfile.confidence + metaprogramProfile.overallConfidence) * 0.1;

        results.push({
          id: template.id,
          title: template.title,
          category: 'combined',
          scenario: template.scenario,
          message: template.baseMessage,
          variables: ['nome', 'empresa', 'beneficio', 'problema'],
          matchScore,
          matchReasons,
          tips,
          source: 'Combinado',
        });
      });
    }

    // Sort by match score
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [vakProfile, metaprogramProfile, discProfile]);

  const filteredSuggestions = useMemo(() => {
    if (activeCategory === 'all') return suggestions;
    return suggestions.filter((s) => s.category === activeCategory);
  }, [suggestions, activeCategory]);

  const categoryBadges = {
    vak: { color: 'bg-info text-info border-info', label: 'VAK' },
    metaprogram: { color: 'bg-secondary text-secondary border-secondary', label: 'Metaprograma' },
    combined: { color: 'bg-success text-success border-success/30', label: 'Combinado' },
  };

  if (!vakProfile && !metaprogramProfile) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Analise o perfil do contato para receber sugestões personalizadas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          Sugestões Baseadas no Perfil
          <Badge variant="secondary" className="ml-auto text-xs">
            {suggestions.length} templates
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Profile summary */}
        <div className="flex flex-wrap gap-2">
          {vakProfile?.primary && (
            <Badge variant="outline" className={cn('text-xs', VAK_DESCRIPTIONS[vakProfile.primary].color)}>
              {React.createElement(VAK_DESCRIPTIONS[vakProfile.primary].icon, { className: 'w-3 h-3 mr-1' })}
              {VAK_DESCRIPTIONS[vakProfile.primary].name}
            </Badge>
          )}
          {discProfile && (
            <Badge variant="outline" className={cn('text-xs', DISC_DESCRIPTIONS[discProfile].color)}>
              {DISC_DESCRIPTIONS[discProfile].icon} {DISC_DESCRIPTIONS[discProfile].name}
            </Badge>
          )}
          {metaprogramProfile && metaprogramProfile.motivationDirection !== 'balanced' && (
            <Badge
              variant="outline"
              className={cn('text-xs', METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection].color)}
            >
              {METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection].icon}{' '}
              {METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection].name}
            </Badge>
          )}
        </div>

        {/* Category filter */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
            <TabsTrigger value="vak" className="text-xs">
              VAK
            </TabsTrigger>
            <TabsTrigger value="metaprogram" className="text-xs">
              Meta
            </TabsTrigger>
            <TabsTrigger value="combined" className="text-xs">
              Combinado
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Suggestions list */}
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group">
                        {/* Score indicator */}
                        <div className="relative w-10 h-10 shrink-0">
                          <svg className="w-10 h-10 -rotate-90">
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              className="text-muted/20"
                            />
                            <circle
                              cx="20"
                              cy="20"
                              r="16"
                              stroke="currentColor"
                              strokeWidth="3"
                              fill="none"
                              strokeDasharray={`${(suggestion.matchScore / 100) * 100.5} 100.5`}
                              className="text-primary"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {suggestion.matchScore.toFixed(0)}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium truncate">{suggestion.title}</p>
                            <Badge variant="outline" className={cn('text-xs', categoryBadges[suggestion.category].color)}>
                              {categoryBadges[suggestion.category].label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{suggestion.scenario}</p>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </DialogTrigger>

                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          {suggestion.title}
                        </DialogTitle>
                      </DialogHeader>

                      <TemplatePreviewDialog
                        template={suggestion}
                        contact={contact}
                        onCopy={() => {
                          // Could track usage here
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhuma sugestão para esta categoria</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper function to generate combined messages
function generateCombinedMessage(
  vakProfile: VAKProfile,
  metaProfile: MetaprogramProfile,
  discProfile: DISCProfile | undefined,
  type: 'opening' | 'objection' | 'closing' | 'followup'
): string {
  const vakWords = {
    V: { ver: 'ver', mostrar: 'mostrar', claro: 'claro', visualizar: 'visualizar', perspectiva: 'perspectiva' },
    A: { ver: 'ouvir', mostrar: 'contar', claro: 'ressoar', visualizar: 'sintonizar', perspectiva: 'harmonia' },
    K: { ver: 'sentir', mostrar: 'compartilhar', claro: 'confortável', visualizar: 'experimentar', perspectiva: 'sensação' },
    D: { ver: 'analisar', mostrar: 'apresentar dados', claro: 'lógico', visualizar: 'calcular', perspectiva: 'análise' },
  };

  const vak = vakWords[vakProfile.primary];
  const isToward = metaProfile.motivationDirection === 'toward';
  const isInternal = metaProfile.referenceFrame === 'internal';
  const isOptions = metaProfile.workingStyle === 'options';

  const messages = {
    opening: {
      toward: `{nome}, quero ${vak.mostrar} como {empresa} pode alcançar {beneficio}. ${isInternal ? 'Tenho certeza que você vai perceber o valor' : 'Nossos clientes confirmam os resultados'}. ${isOptions ? 'Temos várias formas de trabalhar juntos.' : 'O processo é claro e estruturado.'}`,
      away: `{nome}, quero ${vak.mostrar} como resolver {problema} definitivamente. ${isInternal ? 'Você vai ${vak.ver} que faz sentido' : 'Os dados comprovam a eficácia'}. ${isOptions ? 'Podemos adaptar à sua necessidade.' : 'Siga o passo a passo e elimine o problema.'}`,
    },
    objection: {
      toward: `Entendo sua preocupação. Deixa eu ${vak.mostrar} o retorno: {beneficio}. ${isInternal ? 'Avalie por você mesmo' : 'Empresas similares confirmam'}. ${isOptions ? 'Temos opções de investimento.' : 'O processo de retorno é claro.'}`,
      away: `Compreendo. Mas ${vak.ver} o custo de NÃO resolver {problema}. ${isInternal ? 'Você sabe o impacto' : 'Os números mostram o prejuízo'}. ${isOptions ? 'Várias formas de viabilizar.' : 'Estruturamos o pagamento em etapas.'}`,
    },
    closing: {
      toward: `{nome}, está tudo ${vak.claro} para conquistar {beneficio}. ${isInternal ? 'Sinto que você está pronto' : 'Assim como outros clientes'}. ${isOptions ? 'Escolha o plano ideal.' : 'Vamos seguir o próximo passo.'}`,
      away: `{nome}, cada dia sem resolver {problema} custa mais. ${isInternal ? 'Você já sabe disso' : 'Os dados confirmam'}. ${isOptions ? 'Várias formas de começar.' : 'O processo de início é simples.'}`,
    },
    followup: {
      toward: `{nome}, lembrei de você e como {empresa} pode ${vak.ver} {beneficio}. ${isInternal ? 'O que você está pensando?' : 'Temos novidades que outros aprovaram.'}`,
      away: `{nome}, como está a situação com {problema}? Quero ${vak.mostrar} uma solução. ${isInternal ? 'Você já percebeu o impacto' : 'Clientes similares resolveram assim.'}`,
    },
  };

  return isToward ? messages[type].toward : messages[type].away;
}
