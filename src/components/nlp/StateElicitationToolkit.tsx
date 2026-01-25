import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Zap, 
  Heart,
  Shield,
  Target,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';
import { getDominantVAK, getDISCProfile } from '@/lib/contact-utils';
import { toast } from '@/hooks/use-toast';
import { DEMO_CONTACT } from '@/lib/demo-contact';

interface EmotionalState {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  useCase: string;
  scripts: {
    vak: Record<string, string[]>;
    disc: Record<string, string[]>;
  };
}

interface StateElicitationToolkitProps {
  contact?: Contact;
  className?: string;
}

const EMOTIONAL_STATES: EmotionalState[] = [
  {
    id: 'curiosity',
    name: 'Curiosidade',
    description: 'Estado de abertura e interesse em descobrir mais',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-purple-400',
    useCase: 'No início da conversa ou para reengajar',
    scripts: {
      vak: {
        V: [
          'Você já imaginou como seria se...?',
          'Deixa eu te mostrar algo que poucos viram...',
          'Visualize por um momento o que isso poderia significar...'
        ],
        A: [
          'Você já ouviu falar sobre...?',
          'Isso vai soar interessante para você...',
          'Deixa eu te contar algo que poucos sabem...'
        ],
        K: [
          'Você já sentiu aquela sensação quando descobre algo novo?',
          'Tenho algo que pode transformar sua experiência...',
          'Sinta por um momento as possibilidades...'
        ],
        D: [
          'Analisando os dados, descobri algo interessante...',
          'Logicamente, isso faz muito sentido porque...',
          'Considere esta informação exclusiva...'
        ]
      },
      disc: {
        D: ['Tenho um insight rápido que pode mudar seu jogo...', 'Resultado surpreendente...'],
        I: ['Você não vai acreditar no que descobri!', 'Isso é revolucionário!'],
        S: ['Descobri algo que pode trazer mais tranquilidade...', 'Uma solução segura e comprovada...'],
        C: ['Os dados revelaram algo inesperado...', 'Análise detalhada mostra...']
      }
    }
  },
  {
    id: 'confidence',
    name: 'Confiança',
    description: 'Estado de segurança e certeza na decisão',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-400',
    useCase: 'Antes de pedir compromisso ou fechamento',
    scripts: {
      vak: {
        V: [
          'Você pode ver claramente que este é o caminho certo...',
          'Olhando para os resultados, fica evidente...',
          'A imagem do sucesso está bem definida...'
        ],
        A: [
          'Ouvindo outros clientes, você vai confirmar...',
          'Isso ressoa com o que você busca...',
          'A voz da experiência diz que...'
        ],
        K: [
          'Você pode sentir que esta é a escolha certa...',
          'Essa sensação de segurança vem quando...',
          'Confie no que seu instinto está dizendo...'
        ],
        D: [
          'Os dados confirmam que...',
          'Logicamente, a conclusão é clara...',
          'A análise demonstra que...'
        ]
      },
      disc: {
        D: ['Você está no controle total desta decisão...', 'Resultados garantidos...'],
        I: ['Imagine o reconhecimento quando isso funcionar!', 'Todo mundo vai adorar!'],
        S: ['Milhares de clientes satisfeitos comprovam...', 'Segurança total garantida...'],
        C: ['Todos os dados apontam para...', 'Metodicamente comprovado...']
      }
    }
  },
  {
    id: 'urgency',
    name: 'Urgência',
    description: 'Estado de motivação para agir agora',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-orange-400',
    useCase: 'Para acelerar decisões e evitar procrastinação',
    scripts: {
      vak: {
        V: [
          'Imagine onde você estará em 6 meses se começar hoje...',
          'Veja a diferença entre agir agora e esperar...',
          'O quadro muda rapidamente...'
        ],
        A: [
          'Escute: cada dia que passa é uma oportunidade perdida...',
          'O tempo está chamando você para agir...',
          'Ouça o que o mercado está dizendo...'
        ],
        K: [
          'Sinta a importância deste momento...',
          'O peso da decisão pede ação...',
          'Agarre esta oportunidade enquanto pode...'
        ],
        D: [
          'Considere o custo da inação...',
          'Os números mostram que o timing é agora...',
          'Analise o custo de oportunidade...'
        ]
      },
      disc: {
        D: ['Decisores agem rápido. O mercado não espera.', 'Resultados imediatos para quem age agora.'],
        I: ['Você vai ser o primeiro a ter isso!', 'Não perca essa oportunidade única!'],
        S: ['A janela de segurança está se fechando...', 'Garanta sua posição agora...'],
        C: ['Os dados indicam que este é o momento ideal...', 'Análise temporal mostra...']
      }
    }
  },
  {
    id: 'desire',
    name: 'Desejo',
    description: 'Estado de querer intensamente algo',
    icon: <Heart className="h-5 w-5" />,
    color: 'text-pink-400',
    useCase: 'Para amplificar a motivação e o comprometimento',
    scripts: {
      vak: {
        V: [
          'Imagine-se já tendo conquistado isso...',
          'Veja você mesmo no cenário ideal...',
          'Visualize a transformação...'
        ],
        A: [
          'Ouça os parabéns quando você conseguir...',
          'Como vai soar quando você contar para todos?',
          'Escute a voz do sucesso...'
        ],
        K: [
          'Sinta como será quando você tiver isso...',
          'A sensação de realização é incrível...',
          'Toque no seu objetivo...'
        ],
        D: [
          'Considere todos os benefícios que você terá...',
          'Pense no impacto positivo...',
          'Analise as vantagens...'
        ]
      },
      disc: {
        D: ['Domine seu mercado com isso.', 'Seja o líder que você quer ser.'],
        I: ['Imagine a admiração de todos!', 'Você vai brilhar!'],
        S: ['A paz de espírito que isso traz...', 'Estabilidade e harmonia...'],
        C: ['A excelência que você busca está aqui.', 'Qualidade comprovada.']
      }
    }
  },
  {
    id: 'commitment',
    name: 'Comprometimento',
    description: 'Estado de determinação para seguir em frente',
    icon: <Target className="h-5 w-5" />,
    color: 'text-green-400',
    useCase: 'No momento do fechamento e pós-venda',
    scripts: {
      vak: {
        V: [
          'Você pode se ver comprometido com este caminho...',
          'Olhe para frente e veja o destino...',
          'A visão está clara, agora é seguir...'
        ],
        A: [
          'Você está pronto para dizer sim?',
          'Ouça sua decisão interior...',
          'Diga a si mesmo: eu vou fazer isso...'
        ],
        K: [
          'Sinta a força da sua decisão...',
          'Segure firme neste compromisso...',
          'A sensação de determinação te guia...'
        ],
        D: [
          'Sua decisão está tomada. Agora é executar.',
          'Comprometa-se com os resultados.',
          'A lógica suporta sua escolha.'
        ]
      },
      disc: {
        D: ['Sua decisão, sua vitória. Vamos começar.', 'Resultados esperam por você.'],
        I: ['Você fez a escolha certa! Vai ser incrível!', 'Celebre essa decisão!'],
        S: ['Estamos juntos nessa jornada.', 'Você tem todo meu apoio.'],
        C: ['Sua análise foi precisa. Próximos passos...', 'Metodicamente correto.']
      }
    }
  }
];

const StateElicitationToolkit: React.FC<StateElicitationToolkitProps> = ({
  contact,
  className
}) => {
  const activeContact = contact || DEMO_CONTACT;
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const vakType = getDominantVAK(activeContact) as VAKType || 'V';
  const discProfile = (getDISCProfile(activeContact) as DISCProfile) || 'D';

  const copyScript = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(script);
    setTimeout(() => setCopiedScript(null), 2000);
    toast({
      title: "Copiado!",
      description: "Script de eliciação copiado"
    });
  };

  const getStateScripts = (state: EmotionalState) => {
    const vakScripts = state.scripts.vak[vakType] || state.scripts.vak['V'];
    const discScripts = state.scripts.disc[discProfile] || [];
    return { vakScripts, discScripts };
  };

  return (
    <Card className={cn("border-rose-500/30 bg-gradient-to-br from-rose-950/20 to-background", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-rose-400" />
            State Elicitation Toolkit
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-rose-500/20">
              VAK: {vakType}
            </Badge>
            <Badge variant="outline" className="bg-purple-500/20">
              DISC: {discProfile}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Scripts para eliciar estados emocionais específicos em {activeContact.firstName}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* State Selector */}
        <div className="grid grid-cols-5 gap-1">
          {EMOTIONAL_STATES.map(state => (
            <button
              key={state.id}
              onClick={() => setSelectedState(selectedState === state.id ? null : state.id)}
              className={cn(
                "p-2 rounded-lg border text-center transition-all",
                selectedState === state.id 
                  ? 'bg-rose-500/20 border-rose-500/50' 
                  : 'bg-muted/30 border-transparent hover:bg-muted/50'
              )}
            >
              <div className={cn("flex justify-center mb-1", state.color)}>
                {state.icon}
              </div>
              <div className="text-[10px] font-medium truncate">{state.name}</div>
            </button>
          ))}
        </div>

        {/* Selected State Details */}
        <AnimatePresence mode="wait">
          {selectedState && (
            <motion.div
              key={selectedState}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {(() => {
                const state = EMOTIONAL_STATES.find(s => s.id === selectedState)!;
                const { vakScripts, discScripts } = getStateScripts(state);
                
                return (
                  <>
                    <div className={cn("bg-muted/30 rounded-lg p-3 border-l-4", `border-l-${state.color.replace('text-', '')}`)} style={{ borderLeftColor: state.color.includes('purple') ? '#a855f7' : state.color.includes('blue') ? '#60a5fa' : state.color.includes('orange') ? '#fb923c' : state.color.includes('pink') ? '#f472b6' : '#4ade80' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={state.color}>{state.icon}</span>
                        <span className="font-medium">{state.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{state.description}</p>
                      <div className="text-xs">
                        <span className="text-muted-foreground">Quando usar:</span>{' '}
                        <span>{state.useCase}</span>
                      </div>
                    </div>

                    {/* VAK Adapted Scripts */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Scripts adaptados para {vakType} ({vakType === 'V' ? 'Visual' : vakType === 'A' ? 'Auditivo' : vakType === 'K' ? 'Cinestésico' : 'Digital'}):
                      </div>
                      {vakScripts.map((script, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => copyScript(script)}
                          className="w-full text-left bg-rose-500/10 rounded p-2 text-sm hover:bg-rose-500/20 transition-colors flex items-center justify-between group border border-rose-500/20"
                        >
                          <span className="italic">"{script}"</span>
                          {copiedScript === script ? (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* DISC Adapted Scripts */}
                    {discScripts.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          Reforço para perfil {discProfile}:
                        </div>
                        {discScripts.map((script, idx) => (
                          <motion.button
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => copyScript(script)}
                            className="w-full text-left bg-purple-500/10 rounded p-2 text-sm hover:bg-purple-500/20 transition-colors flex items-center justify-between group border border-purple-500/20"
                          >
                            <span className="italic">"{script}"</span>
                            {copiedScript === script ? (
                              <Check className="h-3 w-3 text-green-500 shrink-0" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Guide */}
        <div className="bg-muted/20 rounded-lg p-3 text-xs text-muted-foreground">
          <strong className="text-rose-400">💡 Dica de Eliciação:</strong>{' '}
          Para {activeContact.firstName} ({vakType}/{discProfile}), comece com{' '}
          <span className="text-rose-300">
            {vakType === 'V' ? 'imagens e visualizações' : 
             vakType === 'A' ? 'sons e descrições verbais' :
             vakType === 'K' ? 'sensações e experiências' :
             'dados e lógica'}
          </span> e adapte o ritmo para{' '}
          <span className="text-purple-300">
            {discProfile === 'D' ? 'direto e rápido' :
             discProfile === 'I' ? 'entusiasta e social' :
             discProfile === 'S' ? 'calmo e seguro' :
             'detalhado e preciso'}
          </span>.
        </div>
      </CardContent>
    </Card>
  );
};

export default StateElicitationToolkit;
