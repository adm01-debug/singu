// ==============================================
// DISC Training Mode - Interactive Practice Scenarios
// Enterprise Level Component
// ==============================================

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap, Trophy, Brain, Target, 
  Check, X, RefreshCw, ChevronRight, Sparkles,
  MessageSquare, Lightbulb, Award, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DISCProfile } from '@/types';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import confetti from 'canvas-confetti';

interface TrainingScenario {
  id: string;
  profile: Exclude<DISCProfile, null>;
  situation: string;
  clientStatement: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
    profileAlignment: number; // 0-100
  }[];
  learningPoint: string;
}

interface TrainingProgress {
  scenariosCompleted: number;
  correctAnswers: number;
  profileMastery: Record<string, number>;
  streak: number;
}

const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: '1',
    profile: 'D',
    situation: 'Apresentação de proposta para um CEO impaciente',
    clientStatement: '"Olha, não tenho muito tempo. O que você tem pra me mostrar?"',
    options: [
      {
        id: '1a',
        text: 'Vou direto ao ponto: nossa solução aumenta resultados em 40% em 3 meses.',
        isCorrect: true,
        explanation: 'Perfeito! Perfis D valorizam objetividade e resultados mensuráveis.',
        profileAlignment: 95
      },
      {
        id: '1b',
        text: 'Deixa eu te contar uma história sobre como ajudamos outras empresas...',
        isCorrect: false,
        explanation: 'Perfis D não têm paciência para histórias longas. Seja direto!',
        profileAlignment: 20
      },
      {
        id: '1c',
        text: 'Entendo sua pressa. Vamos revisar todos os detalhes com calma...',
        isCorrect: false,
        explanation: 'Contradiz a urgência do cliente D. Ele quer velocidade.',
        profileAlignment: 15
      },
      {
        id: '1d',
        text: 'Que bom te conhecer! Vamos criar uma conexão primeiro.',
        isCorrect: false,
        explanation: 'Perfis D priorizam resultados sobre relacionamentos iniciais.',
        profileAlignment: 25
      }
    ],
    learningPoint: 'Com perfis Dominantes, vá direto aos resultados e números.'
  },
  {
    id: '2',
    profile: 'I',
    situation: 'Reunião de follow-up com gerente de marketing entusiasta',
    clientStatement: '"Ei! Adorei nossa última conversa! Tenho tantas ideias!"',
    options: [
      {
        id: '2a',
        text: 'Vamos aos dados: aqui estão as métricas detalhadas...',
        isCorrect: false,
        explanation: 'Perfis I preferem entusiasmo a dados frios no início.',
        profileAlignment: 30
      },
      {
        id: '2b',
        text: 'Que incrível! Estou animado também! Me conta suas ideias!',
        isCorrect: true,
        explanation: 'Excelente! Espelhar o entusiasmo cria rapport imediato com perfis I.',
        profileAlignment: 95
      },
      {
        id: '2c',
        text: 'Ótimo. Vamos seguir o processo passo a passo.',
        isCorrect: false,
        explanation: 'Muito estruturado. Perfis I preferem flexibilidade e criatividade.',
        profileAlignment: 25
      },
      {
        id: '2d',
        text: 'Entendo. Precisamos avaliar isso com cuidado.',
        isCorrect: false,
        explanation: 'Tom cauteloso não combina com a energia expansiva do I.',
        profileAlignment: 20
      }
    ],
    learningPoint: 'Espelhe o entusiasmo e deixe o I compartilhar suas ideias.'
  },
  {
    id: '3',
    profile: 'S',
    situation: 'Negociação com cliente fiel há 5 anos que resiste a mudanças',
    clientStatement: '"Sempre funcionou assim. Por que mudar agora?"',
    options: [
      {
        id: '3a',
        text: 'Porque o mercado exige. Você precisa se atualizar ou vai ficar para trás!',
        isCorrect: false,
        explanation: 'Pressão e urgência assustam perfis S. Evite confronto.',
        profileAlignment: 10
      },
      {
        id: '3b',
        text: 'Entendo sua preocupação. Vamos fazer a transição gradualmente, com todo suporte.',
        isCorrect: true,
        explanation: 'Perfeito! Perfis S valorizam segurança, suporte e mudanças graduais.',
        profileAlignment: 95
      },
      {
        id: '3c',
        text: 'Os dados mostram claramente que a mudança é necessária.',
        isCorrect: false,
        explanation: 'Dados sozinhos não convencem S. Eles precisam sentir segurança.',
        profileAlignment: 40
      },
      {
        id: '3d',
        text: 'Imagine as possibilidades incríveis! Vai ser revolucionário!',
        isCorrect: false,
        explanation: 'Revolucionário assusta S. Eles preferem evolução, não revolução.',
        profileAlignment: 25
      }
    ],
    learningPoint: 'Perfis Estáveis precisam de transições graduais e garantias de suporte.'
  },
  {
    id: '4',
    profile: 'C',
    situation: 'Apresentação técnica para analista de sistemas detalhista',
    clientStatement: '"Preciso entender exatamente como isso funciona tecnicamente."',
    options: [
      {
        id: '4a',
        text: 'Confie em mim, funciona! Outros clientes amaram!',
        isCorrect: false,
        explanation: 'Perfis C não aceitam "confie em mim". Querem provas.',
        profileAlignment: 10
      },
      {
        id: '4b',
        text: 'Aqui está a documentação técnica completa com especificações e benchmarks.',
        isCorrect: true,
        explanation: 'Excelente! Perfis C valorizam detalhes, documentação e precisão.',
        profileAlignment: 95
      },
      {
        id: '4c',
        text: 'Vou te dar uma visão geral e depois entramos nos detalhes.',
        isCorrect: false,
        explanation: 'Ele já pediu detalhes. Dê o que ele pediu imediatamente.',
        profileAlignment: 50
      },
      {
        id: '4d',
        text: 'O resultado é o que importa! Isso vai resolver seu problema!',
        isCorrect: false,
        explanation: 'Perfis C querem entender o COMO, não apenas o resultado.',
        profileAlignment: 30
      }
    ],
    learningPoint: 'Perfis Conscientes precisam de dados, documentação e precisão técnica.'
  },
  {
    id: '5',
    profile: 'D',
    situation: 'Objeção de preço de um diretor assertivo',
    clientStatement: '"Isso está caro demais. Qual é o melhor desconto que você pode dar?"',
    options: [
      {
        id: '5a',
        text: 'Entendo. Vou verificar com meu gerente e te retorno...',
        isCorrect: false,
        explanation: 'Perfis D não respeitam quem não tem autoridade de decisão.',
        profileAlignment: 15
      },
      {
        id: '5b',
        text: 'O investimento se paga em 60 dias. ROI de 300%. Fechamos agora?',
        isCorrect: true,
        explanation: 'Perfeito! Perfis D querem resultados, não descontos. Mostre valor.',
        profileAlignment: 95
      },
      {
        id: '5c',
        text: 'Posso fazer 15% de desconto se você precisar...',
        isCorrect: false,
        explanation: 'Ceder rápido faz você parecer fraco para um D.',
        profileAlignment: 20
      },
      {
        id: '5d',
        text: 'Vamos analisar juntos cada componente do investimento...',
        isCorrect: false,
        explanation: 'Muito lento. Perfis D querem decisão rápida.',
        profileAlignment: 35
      }
    ],
    learningPoint: 'Para Dominantes, defenda valor com confiança. Não ceda facilmente.'
  },
  {
    id: '6',
    profile: 'I',
    situation: 'Cliente indeciso que adora conversar mas não fecha',
    clientStatement: '"Adoro conversar com você! Mas ainda não decidi..."',
    options: [
      {
        id: '6a',
        text: 'Imagine seu time comemorando os resultados! Vamos fazer isso acontecer juntos!',
        isCorrect: true,
        explanation: 'Perfeito! Perfis I são motivados por visões positivas e colaboração.',
        profileAlignment: 95
      },
      {
        id: '6b',
        text: 'Vou te enviar uma análise detalhada para você revisar.',
        isCorrect: false,
        explanation: 'Perfis I não se motivam com análises. Querem emoção.',
        profileAlignment: 25
      },
      {
        id: '6c',
        text: 'Precisamos definir isso hoje. Qual é sua decisão?',
        isCorrect: false,
        explanation: 'Pressão direta afasta perfis I. Eles precisam se sentir bem.',
        profileAlignment: 20
      },
      {
        id: '6d',
        text: 'Ok, pense mais e me liga quando decidir.',
        isCorrect: false,
        explanation: 'Passivo demais. Você precisa guiar o I gentilmente.',
        profileAlignment: 15
      }
    ],
    learningPoint: 'Perfis Influentes decidem por emoção. Crie visões positivas e entusiasmo.'
  }
];

interface DISCTrainingModeProps {
  onProgress?: (progress: TrainingProgress) => void;
}

const DISCTrainingMode: React.FC<DISCTrainingModeProps> = ({ onProgress }) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState<TrainingProgress>({
    scenariosCompleted: 0,
    correctAnswers: 0,
    profileMastery: { D: 0, I: 0, S: 0, C: 0 },
    streak: 0
  });
  const [isComplete, setIsComplete] = useState(false);

  const currentScenario = TRAINING_SCENARIOS[currentScenarioIndex];
  const selectedOptionData = currentScenario?.options.find(o => o.id === selectedOption);
  const profileInfo = currentScenario ? DISC_PROFILES[currentScenario.profile] : null;

  const handleSelectOption = useCallback((optionId: string) => {
    if (showResult) return;
    setSelectedOption(optionId);
  }, [showResult]);

  const handleSubmit = useCallback(() => {
    if (!selectedOption || !currentScenario) return;
    setShowResult(true);

    const isCorrect = selectedOptionData?.isCorrect || false;
    
    setProgress(prev => {
      const newMastery = { ...prev.profileMastery };
      if (isCorrect) {
        newMastery[currentScenario.profile] = Math.min(100, (newMastery[currentScenario.profile] || 0) + 25);
      }

      const newProgress = {
        scenariosCompleted: prev.scenariosCompleted + 1,
        correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
        profileMastery: newMastery,
        streak: isCorrect ? prev.streak + 1 : 0
      };

      onProgress?.(newProgress);
      return newProgress;
    });

    if (isCorrect) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }, [selectedOption, currentScenario, selectedOptionData, onProgress]);

  const handleNextScenario = useCallback(() => {
    if (currentScenarioIndex >= TRAINING_SCENARIOS.length - 1) {
      setIsComplete(true);
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 }
      });
    } else {
      setCurrentScenarioIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    }
  }, [currentScenarioIndex]);

  const handleRestart = useCallback(() => {
    setCurrentScenarioIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setIsComplete(false);
    setProgress({
      scenariosCompleted: 0,
      correctAnswers: 0,
      profileMastery: { D: 0, I: 0, S: 0, C: 0 },
      streak: 0
    });
  }, []);

  const overallProgress = (currentScenarioIndex / TRAINING_SCENARIOS.length) * 100;
  const accuracy = progress.scenariosCompleted > 0 
    ? Math.round((progress.correctAnswers / progress.scenariosCompleted) * 100) 
    : 0;

  if (isComplete) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Treinamento Concluído! 🎉</h2>
          <p className="text-muted-foreground mb-6">
            Você completou todos os cenários de treinamento DISC
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-primary">{accuracy}%</div>
              <div className="text-sm text-muted-foreground">Precisão</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-500">{progress.correctAnswers}</div>
              <div className="text-sm text-muted-foreground">Acertos</div>
            </div>
          </div>

          <h3 className="font-medium mb-3">Domínio por Perfil</h3>
          <div className="flex justify-center gap-3 mb-8">
            {(['D', 'I', 'S', 'C'] as const).map(profile => {
              const mastery = progress.profileMastery[profile] || 0;
              const color = profile === 'D' ? 'bg-red-500' : 
                           profile === 'I' ? 'bg-yellow-500' : 
                           profile === 'S' ? 'bg-green-500' : 'bg-blue-500';
              return (
                <div key={profile} className="text-center">
                  <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold mb-1`}>
                    {profile}
                  </div>
                  <div className="text-sm font-medium">{mastery}%</div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleRestart} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reiniciar Treinamento
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Modo Treinamento DISC</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {progress.streak >= 3 && (
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                {progress.streak} seguidos!
              </Badge>
            )}
            <Badge variant="outline">
              {currentScenarioIndex + 1}/{TRAINING_SCENARIOS.length}
            </Badge>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scenario Header */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              style={{ 
                backgroundColor: profileInfo?.color?.bg || 'hsl(var(--muted))',
                color: profileInfo?.color?.text || 'hsl(var(--foreground))'
              }}
            >
              Perfil {currentScenario?.profile}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentScenario?.situation}
            </span>
          </div>
          <div className="bg-background rounded-lg p-4 border">
            <MessageSquare className="w-4 h-4 text-muted-foreground mb-2" />
            <p className="text-lg italic">
              "{currentScenario?.clientStatement}"
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Como você responde?</h4>
          {currentScenario?.options.map((option, idx) => {
            const isSelected = selectedOption === option.id;
            const showCorrect = showResult && option.isCorrect;
            const showWrong = showResult && isSelected && !option.isCorrect;

            return (
              <motion.button
                key={option.id}
                onClick={() => handleSelectOption(option.id)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  showCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : showWrong
                    ? 'border-red-500 bg-red-500/10'
                    : isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                whileHover={!showResult ? { scale: 1.01 } : {}}
                whileTap={!showResult ? { scale: 0.99 } : {}}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    showCorrect
                      ? 'bg-green-500 text-white'
                      : showWrong
                      ? 'bg-red-500 text-white'
                      : isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {showCorrect ? <Check className="w-4 h-4" /> : 
                     showWrong ? <X className="w-4 h-4" /> : 
                     String.fromCharCode(65 + idx)}
                  </div>
                  <span className="flex-1">{option.text}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Result */}
        <AnimatePresence>
          {showResult && selectedOptionData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg ${
                selectedOptionData.isCorrect
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedOptionData.isCorrect ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                  {selectedOptionData.isCorrect ? <Check /> : <X />}
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">
                    {selectedOptionData.isCorrect ? 'Excelente!' : 'Não é a melhor opção'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {selectedOptionData.explanation}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <span className="text-muted-foreground">
                      {currentScenario?.learningPoint}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {!showResult ? (
            <Button 
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="gap-2"
            >
              Confirmar Resposta
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleNextScenario}
              className="gap-2"
            >
              {currentScenarioIndex >= TRAINING_SCENARIOS.length - 1 
                ? 'Ver Resultados' 
                : 'Próximo Cenário'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DISCTrainingMode;
