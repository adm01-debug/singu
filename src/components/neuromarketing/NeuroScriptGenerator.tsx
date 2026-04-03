// ==============================================
// NEURO SCRIPT GENERATOR - Brain-Optimized Sales Scripts
// Generates scripts targeting specific brain systems
// ==============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Copy, 
  Check, 
  RefreshCw,
  Target,
  Sparkles,
  MessageSquare,
  AlertTriangle,
  Heart,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, PrimalStimulus, Neurochemical } from '@/types/neuromarketing';
import { cn } from '@/lib/utils';

interface NeuroScriptGeneratorProps {
  contactId: string;
  contactName: string;
  discProfile?: string | null;
  vakProfile?: string | null;
  interactions?: { content: string; transcription?: string }[];
  className?: string;
}

interface ScriptSection {
  name: string;
  brainTarget: BrainSystem;
  stimuliUsed: PrimalStimulus[];
  content: string;
  timing: string;
}

const NeuroScriptGenerator = ({ 
  contactId, 
  contactName, 
  discProfile,
  vakProfile,
  interactions = [],
  className
}: NeuroScriptGeneratorProps) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['opening']));
  const [scriptGoal, setScriptGoal] = useState<'discovery' | 'presentation' | 'closing' | 'objection'>('presentation');
  const [customContext, setCustomContext] = useState('');
  
  const { 
    analyzeText, 
    generateNeuroProfileFromDISC,
    BRAIN_SYSTEM_INFO,
    PRIMAL_STIMULUS_INFO,
    NEUROCHEMICAL_INFO
  } = useNeuromarketing();

  // Analyze contact profile
  const neuroProfile = useMemo(() => {
    const allText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    if (allText.length >= 50) {
      return analyzeText(allText);
    }
    return null;
  }, [interactions, analyzeText]);

  const discBasedProfile = useMemo(() => {
    if (!discProfile) return null;
    return generateNeuroProfileFromDISC(discProfile as 'D' | 'I' | 'S' | 'C');
  }, [discProfile, generateNeuroProfileFromDISC]);

  const dominantBrain = neuroProfile?.detectedBrainSystem || discBasedProfile?.dominantBrain || 'limbic';
  const firstName = contactName.split(' ')[0];

  // Generate script sections based on brain system and goal
  const scriptSections = useMemo((): ScriptSection[] => {
    const brainInfo = BRAIN_SYSTEM_INFO[dominantBrain];
    
    const scripts: Record<typeof scriptGoal, ScriptSection[]> = {
      discovery: [
        {
          name: 'Abertura (Hook)',
          brainTarget: 'reptilian',
          stimuliUsed: ['self_centered', 'contrast'],
          timing: '0-30 segundos',
          content: dominantBrain === 'reptilian' 
            ? `${firstName}, antes de falarmos sobre [produto], preciso entender: qual é o maior risco que você enfrenta hoje se nada mudar nos próximos 3 meses?`
            : dominantBrain === 'limbic'
            ? `${firstName}, eu estava pensando em você... Como você tem se sentido em relação a [área]? O que mais te incomoda sobre isso?`
            : `${firstName}, gostaria de entender sua situação atual. Quais métricas você usa para avaliar [área]? O que os números mostram?`
        },
        {
          name: 'Exploração de Dor',
          brainTarget: dominantBrain,
          stimuliUsed: ['emotional', 'tangible'],
          timing: '30s - 3min',
          content: dominantBrain === 'reptilian'
            ? `E se isso continuar, qual seria o impacto no seu [negócio/equipe/posição]? Já calculou quanto isso pode custar?`
            : dominantBrain === 'limbic'
            ? `Isso me parece frustrante... Como sua equipe reage a isso? E você pessoalmente, como se sente lidando com isso todo dia?`
            : `Interessante. Você tem dados sobre o impacto atual? Qual é o custo de oportunidade de não resolver isso?`
        },
        {
          name: 'Transição Suave',
          brainTarget: 'limbic',
          stimuliUsed: ['memorable', 'self_centered'],
          timing: '3-5min',
          content: `Entendo completamente, ${firstName}. Muitos dos meus melhores clientes estavam exatamente nessa situação antes de conversarmos. Posso te mostrar como eles resolveram?`
        }
      ],
      presentation: [
        {
          name: 'Gancho Inicial (Atenção)',
          brainTarget: 'reptilian',
          stimuliUsed: ['contrast', 'visual'],
          timing: '0-30 segundos',
          content: dominantBrain === 'reptilian'
            ? `${firstName}, vou direto ao ponto: você pode continuar fazendo [método atual] e aceitar [consequência negativa], OU pode adotar [solução] e eliminar esse risco completamente. Qual prefere?`
            : dominantBrain === 'limbic'
            ? `${firstName}, lembra quando você mencionou [dor/frustração]? Hoje quero te mostrar como outros profissionais como você superaram exatamente isso... e o que sentiram depois.`
            : `${firstName}, preparei uma análise detalhada para você. Os dados mostram que empresas no seu setor que implementaram [solução] viram [métrica específica]. Deixe-me compartilhar os números.`
        },
        {
          name: 'Proposta de Valor (Claim)',
          brainTarget: dominantBrain,
          stimuliUsed: ['tangible', 'self_centered'],
          timing: '30s - 2min',
          content: dominantBrain === 'reptilian'
            ? `Nossa solução é a ÚNICA que oferece [diferencial exclusivo]. Em [tempo], você terá [resultado tangível]. Sem riscos, garantia de [X dias].`
            : dominantBrain === 'limbic'
            ? `O que torna nossa parceria especial é o cuidado genuíno com seus resultados. Não somos apenas fornecedores - somos parceiros comprometidos com seu sucesso. Nossos clientes se tornam amigos.`
            : `Especificamente: ROI de [X%] em [prazo], redução de [Y%] em [métrica], e aumento de [Z%] em [resultado]. Aqui estão os estudos de caso que comprovam.`
        },
        {
          name: 'Prova Social (Gain)',
          brainTarget: 'limbic',
          stimuliUsed: ['memorable', 'emotional'],
          timing: '2-4min',
          content: `A [Empresa X], que enfrentava exatamente o mesmo desafio que você, implementou nossa solução e em [tempo] conseguiu [resultado]. O [Nome do decisor] me disse: "Foi a melhor decisão que tomei este ano."`
        },
        {
          name: 'Contraste Visual',
          brainTarget: 'reptilian',
          stimuliUsed: ['contrast', 'visual'],
          timing: '4-5min',
          content: `Deixe-me mostrar o ANTES e DEPOIS: [Cenário atual com problema] VS [Cenário futuro com solução]. A diferença é de [X] para [Y]. Você consegue visualizar isso na sua operação?`
        },
        {
          name: 'Fechamento (Âncora Final)',
          brainTarget: 'reptilian',
          stimuliUsed: ['emotional', 'self_centered'],
          timing: 'Final',
          content: dominantBrain === 'reptilian'
            ? `${firstName}, você tem duas opções agora: agir hoje e resolver [problema] de vez, ou esperar e continuar pagando o preço de [consequência]. O que faz mais sentido para você?`
            : dominantBrain === 'limbic'
            ? `${firstName}, eu realmente acredito que você merece ter [resultado desejado]. Vamos dar o próximo passo juntos?`
            : `${firstName}, baseado nos dados que analisamos, qual seria o próximo passo lógico para você testar nossa solução?`
        }
      ],
      closing: [
        {
          name: 'Resumo de Valor',
          brainTarget: 'neocortex',
          stimuliUsed: ['tangible', 'contrast'],
          timing: '0-1min',
          content: `Recapitulando, ${firstName}: você terá [benefício 1], [benefício 2] e [benefício 3]. Comparando com sua situação atual, isso representa [melhoria quantificada].`
        },
        {
          name: 'Gatilho de Urgência',
          brainTarget: 'reptilian',
          stimuliUsed: ['emotional', 'self_centered'],
          timing: '1-2min',
          content: dominantBrain === 'reptilian'
            ? `A condição especial que mencionei só é válida até [data]. Depois disso, o investimento aumenta [X%]. Você prefere garantir agora?`
            : dominantBrain === 'limbic'
            ? `${firstName}, a cada dia que passa sem resolver isso, você continua sentindo [frustração]. Não seria um alívio resolver isso hoje?`
            : `Considerando o custo de oportunidade de R$ [valor]/mês, cada semana de atraso representa R$ [valor] perdido. Matematicamente, faz sentido começar quando?`
        },
        {
          name: 'Call to Action Final',
          brainTarget: dominantBrain,
          stimuliUsed: ['memorable', 'emotional'],
          timing: 'Final',
          content: dominantBrain === 'reptilian'
            ? `Vamos fazer assim: assine agora e você está protegido a partir de hoje. Qual o melhor email para enviar o contrato?`
            : dominantBrain === 'limbic'
            ? `Estou animado em começar essa parceria com você, ${firstName}. Vamos dar o primeiro passo juntos?`
            : `Então, para formalizar: precisamos de [documentos]. Você consegue providenciar hoje para começarmos [data]?`
        }
      ],
      objection: [
        {
          name: 'Validação Empática',
          brainTarget: 'limbic',
          stimuliUsed: ['emotional', 'self_centered'],
          timing: 'Imediato',
          content: `Entendo perfeitamente sua preocupação, ${firstName}. É uma consideração muito válida e mostra que você está pensando com cuidado nisso.`
        },
        {
          name: 'Reenquadramento (Sleight of Mouth)',
          brainTarget: dominantBrain,
          stimuliUsed: ['contrast', 'tangible'],
          timing: '10-30s',
          content: dominantBrain === 'reptilian'
            ? `E se eu pudesse mostrar que NÃO tomar essa decisão é na verdade o maior risco? O custo de não agir é [consequência específica].`
            : dominantBrain === 'limbic'
            ? `Muitos dos nossos melhores clientes tiveram a mesma dúvida no início. Sabe o que eles dizem agora? Que gostariam de ter começado antes.`
            : `Vamos analisar os números juntos: [dado 1] vs [dado 2]. Quando você olha dessa forma, qual conclusão os dados sugerem?`
        },
        {
          name: 'Prova Específica',
          brainTarget: 'neocortex',
          stimuliUsed: ['tangible', 'memorable'],
          timing: '30s - 1min',
          content: `Deixe-me compartilhar um caso real: [Nome] tinha exatamente essa objeção. Implementamos [solução] e em [prazo] ele viu [resultado]. Posso te conectar com ele se quiser.`
        },
        {
          name: 'Retomada Suave',
          brainTarget: dominantBrain,
          stimuliUsed: ['self_centered', 'emotional'],
          timing: 'Final',
          content: `Com essa informação em mente, ${firstName}, o que mais você precisaria saber para se sentir confortável em avançar?`
        }
      ]
    };
    
    return scripts[scriptGoal];
  }, [dominantBrain, firstName, scriptGoal, BRAIN_SYSTEM_INFO]);

  const handleCopy = (content: string, section: string) => {
    navigator.clipboard.writeText(content);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getBrainIcon = (brain: BrainSystem) => {
    switch (brain) {
      case 'reptilian': return <AlertTriangle className="h-4 w-4" />;
      case 'limbic': return <Heart className="h-4 w-4" />;
      case 'neocortex': return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
            >
              <MessageSquare className="h-5 w-5 text-primary" />
            </motion.div>
            Gerador de Scripts Neuro-Otimizados
          </CardTitle>
          <Badge className={cn(BRAIN_SYSTEM_INFO[dominantBrain].bgColor)}>
            {BRAIN_SYSTEM_INFO[dominantBrain].icon} {BRAIN_SYSTEM_INFO[dominantBrain].namePt}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Scripts otimizados para o perfil neural de {firstName}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goal Selector */}
        <div className="flex gap-3">
          <Select value={scriptGoal} onValueChange={(v) => setScriptGoal(v as typeof scriptGoal)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Objetivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discovery">🔍 Descoberta</SelectItem>
              <SelectItem value="presentation">📊 Apresentação</SelectItem>
              <SelectItem value="closing">🤝 Fechamento</SelectItem>
              <SelectItem value="objection">🛡️ Objeções</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Regenerar
          </Button>
        </div>

        <Separator />

        {/* Script Sections */}
        <div className="space-y-3">
          {scriptSections.map((section, index) => (
            <motion.div
              key={section.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.name)}
                className="w-full p-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "p-1.5 rounded-full",
                    BRAIN_SYSTEM_INFO[section.brainTarget].bgColor
                  )}>
                    {getBrainIcon(section.brainTarget)}
                  </span>
                  <div className="text-left">
                    <h4 className="font-medium text-sm">{section.name}</h4>
                    <p className="text-xs text-muted-foreground">{section.timing}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.stimuliUsed.map(stim => (
                    <span key={stim} className="text-sm">
                      {PRIMAL_STIMULUS_INFO[stim]?.icon}
                    </span>
                  ))}
                  {expandedSections.has(section.name) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              {/* Section Content */}
              <AnimatePresence>
                {expandedSections.has(section.name) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="p-3 bg-primary/5 rounded-lg text-sm relative">
                        <p className="pr-8">{section.content}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => handleCopy(section.content, section.name)}
                        >
                          {copiedSection === section.name ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      
                      {/* Stimuli Explanation */}
                      <div className="flex flex-wrap gap-2">
                        {section.stimuliUsed.map(stim => (
                          <Badge key={stim} variant="outline" className="text-xs">
                            {PRIMAL_STIMULUS_INFO[stim]?.icon} {PRIMAL_STIMULUS_INFO[stim]?.namePt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Pro Tips */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-medium text-primary">Dicas para {BRAIN_SYSTEM_INFO[dominantBrain].namePt}:</p>
              <ul className="text-muted-foreground space-y-0.5">
                {BRAIN_SYSTEM_INFO[dominantBrain].communicationStyle.slice(0, 3).map((tip, i) => (
                  <li key={i}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroScriptGenerator;
