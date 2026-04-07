// ==============================================
// NEURO OBJECTION HANDLER - Brain-Specific Objection Responses
// ==============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Brain,
  Copy,
  Check,
  Search,
  Lightbulb,
  AlertTriangle,
  MessageSquare,
  Target,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainSystem, Neurochemical } from '@/types/neuromarketing';
import { BRAIN_SYSTEM_INFO, NEUROCHEMICAL_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ObjectionTemplate {
  id: string;
  category: string;
  objection: string;
  responses: {
    brain: BrainSystem;
    response: string;
    neurochemicalTarget: Neurochemical;
    keyPhrase: string;
  }[];
  commonVariations: string[];
}

interface NeuroObjectionHandlerProps {
  contactId: string;
  contactName: string;
  dominantBrain?: BrainSystem;
  dominantChemical?: Neurochemical;
  className?: string;
}

// Common objections with brain-specific responses
const OBJECTION_TEMPLATES: ObjectionTemplate[] = [
  {
    id: 'price',
    category: 'Preço',
    objection: 'Está muito caro',
    responses: [
      {
        brain: 'reptilian',
        response: 'Entendo sua preocupação. Deixa eu mostrar exatamente quanto você está PERDENDO por dia sem essa solução. São R$ X por dia - isso em um ano representa R$ Y. O investimento se paga em Z semanas.',
        neurochemicalTarget: 'cortisol',
        keyPhrase: 'quanto você está PERDENDO por dia'
      },
      {
        brain: 'limbic',
        response: 'Compreendo totalmente. Muitos dos nossos melhores clientes tiveram a mesma preocupação inicial. O João, por exemplo, me disse exatamente isso. Hoje ele fala que foi a melhor decisão que tomou. Posso contar a história dele?',
        neurochemicalTarget: 'oxytocin',
        keyPhrase: 'nossos melhores clientes tiveram a mesma preocupação'
      },
      {
        brain: 'neocortex',
        response: 'Vamos analisar juntos. Se olharmos o custo por uso, estamos falando de R$ X por dia. Compare isso com [alternativa] que custa R$ Y mas entrega apenas Z. O ROI projetado em 12 meses é de W%.',
        neurochemicalTarget: 'serotonin',
        keyPhrase: 'Se olharmos o custo por uso'
      }
    ],
    commonVariations: ['Não tenho orçamento', 'Preciso de desconto', 'Encontrei mais barato']
  },
  {
    id: 'timing',
    category: 'Timing',
    objection: 'Agora não é o momento certo',
    responses: [
      {
        brain: 'reptilian',
        response: 'Entendo. Mas deixa eu perguntar: o que acontece se você esperar mais 6 meses? Seus concorrentes já estão se movendo. A cada semana que passa, você fica mais para trás.',
        neurochemicalTarget: 'cortisol',
        keyPhrase: 'Seus concorrentes já estão se movendo'
      },
      {
        brain: 'limbic',
        response: 'Faz total sentido. Posso perguntar - o que te faria sentir mais confortável para avançar? Quero entender o que é importante para você neste momento.',
        neurochemicalTarget: 'oxytocin',
        keyPhrase: 'o que é importante para você'
      },
      {
        brain: 'neocortex',
        response: 'Entendo a lógica. Vamos mapear juntos: qual seria o momento ideal e quais critérios precisam ser atendidos? Assim podemos criar um plano que respeite seu timing.',
        neurochemicalTarget: 'serotonin',
        keyPhrase: 'quais critérios precisam ser atendidos'
      }
    ],
    commonVariations: ['Vamos conversar ano que vem', 'Estamos em reestruturação', 'Preciso resolver outras prioridades']
  },
  {
    id: 'authority',
    category: 'Autoridade',
    objection: 'Preciso falar com meu sócio/chefe',
    responses: [
      {
        brain: 'reptilian',
        response: 'Claro, faz sentido. Para garantir que ele tenha todas as informações, o que você acha mais importante destacar? Qual é a maior preocupação que ele teria?',
        neurochemicalTarget: 'adrenaline',
        keyPhrase: 'Para garantir que ele tenha todas as informações'
      },
      {
        brain: 'limbic',
        response: 'Perfeito, é importante ter o apoio de todos. Como você acha que ele vai reagir? Já conversaram sobre esse tipo de solução antes?',
        neurochemicalTarget: 'oxytocin',
        keyPhrase: 'é importante ter o apoio de todos'
      },
      {
        brain: 'neocortex',
        response: 'Faz sentido. Posso preparar uma análise comparativa para facilitar a decisão? Quais métricas são mais importantes para ele avaliar?',
        neurochemicalTarget: 'serotonin',
        keyPhrase: 'Quais métricas são mais importantes'
      }
    ],
    commonVariations: ['Não decido sozinho', 'Preciso de aprovação', 'Vou consultar a diretoria']
  },
  {
    id: 'trust',
    category: 'Confiança',
    objection: 'Não conheço sua empresa',
    responses: [
      {
        brain: 'reptilian',
        response: 'Entendo sua cautela - é inteligente pesquisar antes. Já atendemos [número] empresas como a sua. Posso mostrar casos específicos do seu segmento com resultados comprovados?',
        neurochemicalTarget: 'cortisol',
        keyPhrase: 'Já atendemos [número] empresas como a sua'
      },
      {
        brain: 'limbic',
        response: 'Aprecio sua honestidade. A confiança se constrói com o tempo. Que tal conversarmos com um cliente nosso do seu segmento? Ele pode compartilhar a experiência real.',
        neurochemicalTarget: 'oxytocin',
        keyPhrase: 'A confiança se constrói com o tempo'
      },
      {
        brain: 'neocortex',
        response: 'Faz sentido querer mais informações. Temos estudos de caso documentados, certificações [X, Y, Z] e um período de teste gratuito para você avaliar sem compromisso.',
        neurochemicalTarget: 'serotonin',
        keyPhrase: 'período de teste gratuito para você avaliar'
      }
    ],
    commonVariations: ['Nunca ouvi falar', 'Prefiro marcas conhecidas', 'Quanto tempo vocês existem?']
  },
  {
    id: 'competitor',
    category: 'Concorrência',
    objection: 'Já uso outra solução',
    responses: [
      {
        brain: 'reptilian',
        response: 'Interessante. E você está 100% satisfeito? Ou existe algo que poderia ser melhor? Muitos clientes vieram de [concorrente] e conseguiram [resultado] que antes não tinham.',
        neurochemicalTarget: 'dopamine',
        keyPhrase: 'conseguiram [resultado] que antes não tinham'
      },
      {
        brain: 'limbic',
        response: 'Ótimo que você já valoriza esse tipo de solução! Como tem sido sua experiência? O que você mais gosta e o que gostaria que fosse diferente?',
        neurochemicalTarget: 'oxytocin',
        keyPhrase: 'Como tem sido sua experiência?'
      },
      {
        brain: 'neocortex',
        response: 'Perfeito. Posso fazer uma análise comparativa? Sem compromisso, apenas para você ter clareza se está extraindo o máximo valor ou se existe espaço para otimização.',
        neurochemicalTarget: 'serotonin',
        keyPhrase: 'análise comparativa'
      }
    ],
    commonVariations: ['Estou satisfeito com o atual', 'Tenho contrato vigente', 'Já tentei algo parecido']
  }
];

const NeuroObjectionHandler = ({
  contactId,
  contactName,
  dominantBrain = 'limbic',
  dominantChemical = 'oxytocin',
  className
}: NeuroObjectionHandlerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedObjection, setExpandedObjection] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customObjection, setCustomObjection] = useState('');

  const brainInfo = BRAIN_SYSTEM_INFO[dominantBrain];

  // Filter objections
  const filteredObjections = useMemo(() => {
    if (!searchQuery.trim()) return OBJECTION_TEMPLATES;
    
    const query = searchQuery.toLowerCase();
    return OBJECTION_TEMPLATES.filter(template => 
      template.objection.toLowerCase().includes(query) ||
      template.category.toLowerCase().includes(query) ||
      template.commonVariations.some(v => v.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Get recommended response based on contact's brain
  const getRecommendedResponse = (template: ObjectionTemplate) => {
    return template.responses.find(r => r.brain === dominantBrain) || template.responses[0];
  };

  // Copy to clipboard
  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Neuro Objection Handler</CardTitle>
              <p className="text-xs text-muted-foreground">
                Respostas otimizadas para o cérebro de {contactName}
              </p>
            </div>
          </div>
          <Badge 
            style={{ 
              backgroundColor: `${brainInfo.color}20`,
              color: brainInfo.color,
              borderColor: brainInfo.color
            }}
            variant="outline"
            className="gap-1"
          >
            <Brain className="h-3 w-3" />
            {brainInfo.namePt}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar objeção..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Objection Templates */}
        <div className="space-y-2">
          {filteredObjections.map((template) => {
            const recommended = getRecommendedResponse(template);
            const isExpanded = expandedObjection === template.id;
            
            return (
              <Collapsible
                key={template.id}
                open={isExpanded}
                onOpenChange={() => setExpandedObjection(isExpanded ? null : template.id)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg overflow-hidden"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">"{template.objection}"</p>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {template.commonVariations.slice(0, 2).join(' • ')}
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-3">
                      {/* Recommended response */}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              Resposta Recomendada (Cérebro {brainInfo.namePt})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(recommended.response, `${template.id}-rec`)}
                            className="h-7 gap-1"
                          >
                            {copiedId === `${template.id}-rec` ? (
                              <>
                                <Check className="h-3 w-3" />
                                Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-sm">{recommended.response}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Frase-chave: "{recommended.keyPhrase}"
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              borderColor: NEUROCHEMICAL_INFO[recommended.neurochemicalTarget].color,
                              color: NEUROCHEMICAL_INFO[recommended.neurochemicalTarget].color
                            }}
                          >
                            Ativa {NEUROCHEMICAL_INFO[recommended.neurochemicalTarget].namePt}
                          </Badge>
                        </div>
                      </div>

                      {/* Alternative responses */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Respostas Alternativas
                        </p>
                        {template.responses
                          .filter(r => r.brain !== dominantBrain)
                          .map(response => {
                            const respBrainInfo = BRAIN_SYSTEM_INFO[response.brain];
                            return (
                              <div 
                                key={response.brain}
                                className="p-2 rounded-lg border bg-card"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ 
                                      borderColor: respBrainInfo.color,
                                      color: respBrainInfo.color
                                    }}
                                  >
                                    <Brain className="h-3 w-3 mr-1" />
                                    {respBrainInfo.namePt}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(response.response, `${template.id}-${response.brain}`)}
                                    className="h-6 px-2"
                                  >
                                    {copiedId === `${template.id}-${response.brain}` ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {response.response}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </motion.div>
              </Collapsible>
            );
          })}
        </div>

        {/* No results */}
        {filteredObjections.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma objeção encontrada</p>
            <p className="text-xs mt-1">
              Tente buscar por outras palavras-chave
            </p>
          </div>
        )}

        {/* Pro tip */}
        <div className="p-3 rounded-lg bg-accent/50 border">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-warning mt-0.5" />
            <div>
              <p className="text-sm font-medium">Dica de Neurovendas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Como {contactName} tem cérebro {brainInfo.namePt} dominante, 
                foque em {brainInfo.keyDrivers.slice(0, 2).join(' e ')} ao responder objeções.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeuroObjectionHandler;
