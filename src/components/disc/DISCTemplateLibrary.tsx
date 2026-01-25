// ==============================================
// DISC Template Library - Ready-to-Use Phrases
// Enterprise Level Component
// ==============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Book, Copy, Star, Search, MessageSquare,
  PhoneCall, Mail, Video, Send, CheckCircle,
  Zap, Target, Heart, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DISCProfile } from '@/types';
import { DISC_PROFILES } from '@/data/discAdvancedData';

interface Template {
  id: string;
  category: string;
  context: string;
  template: string;
  discProfiles: Exclude<DISCProfile, null>[];
  channel: 'call' | 'email' | 'whatsapp' | 'meeting' | 'all';
  effectiveness: number;
}

const DISC_TEMPLATES: Template[] = [
  // Dominance (D) Templates
  {
    id: 'd-1',
    category: 'Abertura',
    context: 'Primeira ligação',
    template: 'Vou direto ao ponto: tenho uma solução que pode aumentar seus resultados em X%. Posso te mostrar em 3 minutos?',
    discProfiles: ['D'],
    channel: 'call',
    effectiveness: 95
  },
  {
    id: 'd-2',
    category: 'Fechamento',
    context: 'Proposta final',
    template: 'Baseado nos números que te mostrei, faz sentido fechar agora. Qual forma de pagamento prefere?',
    discProfiles: ['D'],
    channel: 'all',
    effectiveness: 90
  },
  {
    id: 'd-3',
    category: 'Objeção Preço',
    context: 'Cliente reclama do preço',
    template: 'O investimento se paga em X dias. ROI de Y%. Isso é resultado, não custo.',
    discProfiles: ['D'],
    channel: 'all',
    effectiveness: 88
  },
  {
    id: 'd-4',
    category: 'Email',
    context: 'Follow-up após reunião',
    template: 'Assunto: Próximos passos - ROI de X%\n\n[Nome], resumindo: [RESULTADO]. Preciso da sua decisão até [DATA]. Fechamos?',
    discProfiles: ['D'],
    channel: 'email',
    effectiveness: 85
  },

  // Influence (I) Templates
  {
    id: 'i-1',
    category: 'Abertura',
    context: 'Primeira ligação',
    template: 'Oi [Nome]! Que bom finalmente falar com você! Estou super empolgado para te contar sobre algo incrível que está ajudando pessoas como você!',
    discProfiles: ['I'],
    channel: 'call',
    effectiveness: 95
  },
  {
    id: 'i-2',
    category: 'Fechamento',
    context: 'Proposta final',
    template: 'Imagina seu time comemorando quando vocês alcançarem [RESULTADO]! Vamos fazer isso acontecer juntos?',
    discProfiles: ['I'],
    channel: 'all',
    effectiveness: 92
  },
  {
    id: 'i-3',
    category: 'Indicação',
    context: 'Pedir referências',
    template: 'Você é incrível! Quem mais do seu círculo poderia se beneficiar disso? Adoraria ajudar seus amigos também!',
    discProfiles: ['I'],
    channel: 'all',
    effectiveness: 90
  },
  {
    id: 'i-4',
    category: 'WhatsApp',
    context: 'Manter relacionamento',
    template: 'Ei [Nome]! 🌟 Vi [NOTÍCIA/POST] e lembrei de você! Como estão as coisas? Tenho uma novidade que acho que você vai ADORAR!',
    discProfiles: ['I'],
    channel: 'whatsapp',
    effectiveness: 88
  },

  // Steadiness (S) Templates
  {
    id: 's-1',
    category: 'Abertura',
    context: 'Primeira ligação',
    template: 'Olá [Nome], espero que esteja tendo um dia tranquilo. Quero que se sinta à vontade. Posso te explicar com calma como posso te ajudar?',
    discProfiles: ['S'],
    channel: 'call',
    effectiveness: 95
  },
  {
    id: 's-2',
    category: 'Fechamento',
    context: 'Proposta final',
    template: 'Vou te dar todo o suporte que precisar. Podemos começar devagar e ajustar conforme você se sentir confortável. O que acha?',
    discProfiles: ['S'],
    channel: 'all',
    effectiveness: 92
  },
  {
    id: 's-3',
    category: 'Objeção Mudança',
    context: 'Cliente resiste a mudanças',
    template: 'Entendo completamente. A transição será gradual, com treinamento completo e suporte 24h. Você não vai ficar sozinho nisso.',
    discProfiles: ['S'],
    channel: 'all',
    effectiveness: 90
  },
  {
    id: 's-4',
    category: 'Email',
    context: 'Follow-up cuidadoso',
    template: 'Assunto: Estou aqui para ajudar\n\nOlá [Nome],\n\nEspero que esteja bem. Estou à disposição para qualquer dúvida. Sem pressa - podemos conversar quando você se sentir pronto.\n\nUm abraço',
    discProfiles: ['S'],
    channel: 'email',
    effectiveness: 88
  },

  // Conscientiousness (C) Templates
  {
    id: 'c-1',
    category: 'Abertura',
    context: 'Primeira ligação',
    template: 'Bom dia [Nome]. Preparei uma análise detalhada com dados específicos para sua situação. Posso compartilhar os números?',
    discProfiles: ['C'],
    channel: 'call',
    effectiveness: 95
  },
  {
    id: 'c-2',
    category: 'Fechamento',
    context: 'Proposta final',
    template: 'Analisando todos os pontos que discutimos, os dados indicam [CONCLUSÃO]. Faz sentido lógico prosseguir. Posso enviar a documentação formal?',
    discProfiles: ['C'],
    channel: 'all',
    effectiveness: 92
  },
  {
    id: 'c-3',
    category: 'Objeção Técnica',
    context: 'Cliente quer mais detalhes',
    template: 'Excelente pergunta. Aqui estão as especificações técnicas: [DADOS]. Posso enviar a documentação completa com benchmarks e comparativos.',
    discProfiles: ['C'],
    channel: 'all',
    effectiveness: 90
  },
  {
    id: 'c-4',
    category: 'Email',
    context: 'Proposta formal',
    template: 'Assunto: Análise Detalhada - [TEMA]\n\nPrezado [Nome],\n\nConforme solicitado, segue análise completa:\n\n1. Dados atuais: [X]\n2. Projeção: [Y]\n3. ROI esperado: [Z]\n4. Metodologia: [LINK]\n\nAguardo sua análise.\n\nAtenciosamente',
    discProfiles: ['C'],
    channel: 'email',
    effectiveness: 88
  },

  // Universal Templates
  {
    id: 'u-1',
    category: 'Rapport',
    context: 'Criar conexão inicial',
    template: '[Adaptar ao perfil] Vi que você [INTERESSE/CONQUISTA]. Como foi essa experiência?',
    discProfiles: ['D', 'I', 'S', 'C'],
    channel: 'all',
    effectiveness: 85
  },
  {
    id: 'u-2',
    category: 'Descoberta',
    context: 'Entender necessidades',
    template: 'O que seria um sucesso para você nesse projeto? Como você saberia que funcionou?',
    discProfiles: ['D', 'I', 'S', 'C'],
    channel: 'all',
    effectiveness: 90
  }
];

const CHANNEL_ICONS = {
  call: <PhoneCall className="w-3 h-3" />,
  email: <Mail className="w-3 h-3" />,
  whatsapp: <Send className="w-3 h-3" />,
  meeting: <Video className="w-3 h-3" />,
  all: <MessageSquare className="w-3 h-3" />
};

const PROFILE_ICONS = {
  D: <Zap className="w-3 h-3" />,
  I: <Star className="w-3 h-3" />,
  S: <Heart className="w-3 h-3" />,
  C: <Shield className="w-3 h-3" />
};

interface DISCTemplateLibraryProps {
  filterProfile?: Exclude<DISCProfile, null>;
}

const DISCTemplateLibrary: React.FC<DISCTemplateLibraryProps> = ({ filterProfile }) => {
  const { toast } = useToast();
  const [activeProfile, setActiveProfile] = useState<string>(filterProfile || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return DISC_TEMPLATES.filter(template => {
      const matchesProfile = activeProfile === 'all' || template.discProfiles.includes(activeProfile as Exclude<DISCProfile, null>);
      const matchesSearch = searchQuery === '' || 
        template.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.context.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProfile && matchesSearch;
    });
  }, [activeProfile, searchQuery]);

  const categories = useMemo(() => {
    const cats = [...new Set(filteredTemplates.map(t => t.category))];
    return cats;
  }, [filteredTemplates]);

  const copyToClipboard = async (template: Template) => {
    await navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: '📋 Template Copiado!',
      description: `${template.category} - ${template.context}`
    });
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Biblioteca de Templates DISC</CardTitle>
          </div>
          <Badge variant="outline">{filteredTemplates.length} templates</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeProfile} onValueChange={setActiveProfile}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
            {(['D', 'I', 'S', 'C'] as const).map(profile => (
              <TabsTrigger key={profile} value={profile} className="flex-1 gap-1">
                {PROFILE_ICONS[profile]}
                {profile}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Templates by Category */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {categories.map(category => {
              const categoryTemplates = filteredTemplates.filter(t => t.category === category);
              if (categoryTemplates.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {categoryTemplates.map(template => {
                      const profileInfo = template.discProfiles.length === 1 
                        ? DISC_PROFILES[template.discProfiles[0]]
                        : null;
                      const isCopied = copiedId === template.id;

                      return (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="gap-1">
                                {CHANNEL_ICONS[template.channel]}
                                {template.channel === 'all' ? 'Todos' : template.channel}
                              </Badge>
                              {template.discProfiles.map(p => (
                                <Badge 
                                  key={p}
                                  style={{ 
                                    backgroundColor: DISC_PROFILES[p]?.color?.bg,
                                    color: DISC_PROFILES[p]?.color?.text
                                  }}
                                  className="gap-1"
                                >
                                  {PROFILE_ICONS[p]}
                                  {p}
                                </Badge>
                              ))}
                              <span className="text-xs text-muted-foreground">
                                {template.context}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {template.effectiveness}% eficaz
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-line leading-relaxed">
                                {template.template}
                              </p>
                            </div>
                            <Button
                              variant={isCopied ? "default" : "outline"}
                              size="sm"
                              onClick={() => copyToClipboard(template)}
                              className="gap-1 shrink-0"
                            >
                              {isCopied ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copiar
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DISCTemplateLibrary;
