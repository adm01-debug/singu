// ==============================================
// NEURO TRAINING MODE - Interactive Brain System Training
// ==============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Brain,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Lightbulb,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainSystem } from '@/types/neuromarketing';
import { BRAIN_SYSTEM_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';

interface TrainingQuestion {
  id: string;
  type: 'identify_brain' | 'match_stimulus' | 'choose_approach';
  scenario: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  hint: string;
  learningPoint: string;
}

interface NeuroTrainingModeProps {
  className?: string;
  onComplete?: (score: number, total: number) => void;
}

// Training questions bank
const TRAINING_QUESTIONS: TrainingQuestion[] = [
  {
    id: 'q1',
    type: 'identify_brain',
    scenario: 'O cliente diz: "Preciso resolver isso AGORA, meus concorrentes estão avançando e não posso ficar para trás!"',
    options: [
      { id: 'reptilian', label: 'Cérebro Reptiliano', isCorrect: true, explanation: 'Palavras como "AGORA", "concorrentes" e "ficar para trás" indicam medo e urgência - gatilhos reptilianos.' },
      { id: 'limbic', label: 'Cérebro Límbico', isCorrect: false, explanation: 'O cérebro límbico focaria em relacionamentos e emoções positivas, não em medo.' },
      { id: 'neocortex', label: 'Neocórtex', isCorrect: false, explanation: 'O neocórtex buscaria dados e análise lógica, não expressaria urgência emocional.' }
    ],
    hint: 'Procure palavras relacionadas a sobrevivência, medo ou urgência.',
    learningPoint: 'O cérebro reptiliano é ativado por ameaças à sobrevivência e urgência. Use contrastes (antes/depois) e garantias.'
  },
  {
    id: 'q2',
    type: 'identify_brain',
    scenario: 'O cliente diz: "Antes de decidir, preciso ver os dados de ROI, comparar com outras opções e analisar o custo-benefício detalhadamente."',
    options: [
      { id: 'reptilian', label: 'Cérebro Reptiliano', isCorrect: false, explanation: 'Não há indicadores de urgência ou medo nesta fala.' },
      { id: 'limbic', label: 'Cérebro Límbico', isCorrect: false, explanation: 'Não há foco em relacionamentos ou emoções.' },
      { id: 'neocortex', label: 'Neocórtex', isCorrect: true, explanation: 'Palavras como "dados", "comparar", "analisar" e "custo-benefício" são típicas do pensamento analítico.' }
    ],
    hint: 'Este cliente está pedindo informações para análise racional.',
    learningPoint: 'O neocórtex processa lógica e dados. Forneça comparações, estatísticas e tempo para análise.'
  },
  {
    id: 'q3',
    type: 'identify_brain',
    scenario: 'O cliente diz: "O mais importante para mim é trabalhar com alguém em quem eu confie. Vocês parecem ser pessoas boas, isso conta muito."',
    options: [
      { id: 'reptilian', label: 'Cérebro Reptiliano', isCorrect: false, explanation: 'Não há indicadores de medo ou urgência.' },
      { id: 'limbic', label: 'Cérebro Límbico', isCorrect: true, explanation: 'Foco em confiança, pessoas e relacionamento são características do cérebro límbico.' },
      { id: 'neocortex', label: 'Neocórtex', isCorrect: false, explanation: 'A decisão não está baseada em análise lógica.' }
    ],
    hint: 'Este cliente valoriza aspectos emocionais e relacionais.',
    learningPoint: 'O cérebro límbico é o centro das emoções e confiança. Construa rapport, use storytelling e mostre valores compartilhados.'
  },
  {
    id: 'q4',
    type: 'match_stimulus',
    scenario: 'Qual estímulo primal é ativado quando você mostra "ANTES: R$ 50.000 de prejuízo | DEPOIS: R$ 200.000 de lucro"?',
    options: [
      { id: 'contrast', label: 'Contraste', isCorrect: true, explanation: 'A comparação direta Antes/Depois é o estímulo de Contraste puro.' },
      { id: 'tangible', label: 'Tangível', isCorrect: false, explanation: 'Embora os números sejam tangíveis, o principal estímulo aqui é o contraste.' },
      { id: 'emotional', label: 'Emocional', isCorrect: false, explanation: 'O contraste pode gerar emoção, mas não é o estímulo primário aqui.' }
    ],
    hint: 'Observe a estrutura da mensagem: ela compara dois estados.',
    learningPoint: 'O Contraste ajuda o cérebro primitivo a decidir rapidamente. Sempre mostre o "antes sem você" vs "depois com você".'
  },
  {
    id: 'q5',
    type: 'match_stimulus',
    scenario: 'Qual estímulo é ativado com: "Em 30 dias, você vai recuperar R$ 15.000, ou devolvemos seu dinheiro."?',
    options: [
      { id: 'self_centered', label: 'Egocêntrico', isCorrect: false, explanation: 'O "você" está presente, mas não é o estímulo principal.' },
      { id: 'tangible', label: 'Tangível', isCorrect: true, explanation: 'Números específicos (30 dias, R$ 15.000) e garantia concreta ativam o estímulo Tangível.' },
      { id: 'memorable', label: 'Memorável', isCorrect: false, explanation: 'A frase pode ser lembrada, mas o estímulo principal são os dados concretos.' }
    ],
    hint: 'Procure elementos concretos, específicos e mensuráveis.',
    learningPoint: 'O estímulo Tangível usa números específicos, prazos exatos e provas concretas para criar credibilidade.'
  },
  {
    id: 'q6',
    type: 'choose_approach',
    scenario: 'Um cliente reptiliano está hesitando. Qual é a melhor abordagem?',
    options: [
      { id: 'a', label: 'Mostrar casos de sucesso de clientes parecidos', isCorrect: false, explanation: 'Isso funcionaria melhor com o cérebro límbico.' },
      { id: 'b', label: 'Criar urgência mostrando o custo de não agir agora', isCorrect: true, explanation: 'O reptiliano responde a ameaças e perdas. Mostre o que ele PERDE por esperar.' },
      { id: 'c', label: 'Apresentar uma análise detalhada de ROI', isCorrect: false, explanation: 'Isso funcionaria melhor com o neocórtex.' }
    ],
    hint: 'O cérebro reptiliano é motivado por sobrevivência e evitar perdas.',
    learningPoint: 'Para o reptiliano: crie urgência genuína, mostre perdas por inação, e ofereça segurança/garantias.'
  },
  {
    id: 'q7',
    type: 'choose_approach',
    scenario: 'Um cliente com neocórtex dominante pede mais tempo para decidir. O que fazer?',
    options: [
      { id: 'a', label: 'Pressionar com desconto por tempo limitado', isCorrect: false, explanation: 'Isso pode parecer manipulativo e afastar o cliente analítico.' },
      { id: 'b', label: 'Oferecer documentação comparativa e marcar follow-up', isCorrect: true, explanation: 'O neocórtex precisa de dados para processar. Respeite o tempo e forneça informação.' },
      { id: 'c', label: 'Compartilhar histórias emocionais de outros clientes', isCorrect: false, explanation: 'Histórias funcionam melhor com o cérebro límbico.' }
    ],
    hint: 'O neocórtex valoriza análise racional e tempo para processar.',
    learningPoint: 'Para o neocórtex: forneça dados, comparações e documentação. Nunca pressione - deixe ele processar.'
  },
  {
    id: 'q8',
    type: 'choose_approach',
    scenario: 'Como construir confiança com um cliente de cérebro límbico dominante?',
    options: [
      { id: 'a', label: 'Mostrar estatísticas impressionantes de resultados', isCorrect: false, explanation: 'Estatísticas são mais eficazes com o neocórtex.' },
      { id: 'b', label: 'Criar urgência sobre o risco de não agir', isCorrect: false, explanation: 'Urgência funciona melhor com o reptiliano.' },
      { id: 'c', label: 'Compartilhar histórias pessoais e mostrar valores em comum', isCorrect: true, explanation: 'O límbico é conectado por emoções, histórias e valores compartilhados.' }
    ],
    hint: 'O cérebro límbico é o centro das emoções e relacionamentos.',
    learningPoint: 'Para o límbico: use storytelling, mostre empatia, encontre valores em comum e construa relacionamento antes de vender.'
  }
];

const NeuroTrainingMode = ({
  className,
  onComplete
}: NeuroTrainingModeProps) => {
  const [isTraining, setIsTraining] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [showLearning, setShowLearning] = useState(false);

  const currentQuestion = TRAINING_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / TRAINING_QUESTIONS.length) * 100;
  const isComplete = currentQuestionIndex >= TRAINING_QUESTIONS.length;

  const handleStartTraining = () => {
    setIsTraining(true);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowLearning(false);
  };

  const handleSelectAnswer = (answerId: string) => {
    if (showResult) return;
    setSelectedAnswer(answerId);
  };

  const handleConfirmAnswer = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = currentQuestion.options.find(o => o.id === selectedAnswer)?.isCorrect;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (showLearning) {
      setShowLearning(false);
      setShowResult(false);
      setSelectedAnswer(null);
      
      if (currentQuestionIndex + 1 < TRAINING_QUESTIONS.length) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        onComplete?.(score, TRAINING_QUESTIONS.length);
      }
    } else {
      setShowLearning(true);
    }
  };

  const handleRestart = () => {
    handleStartTraining();
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'identify_brain': return 'Identifique o Cérebro';
      case 'match_stimulus': return 'Identifique o Estímulo';
      case 'choose_approach': return 'Escolha a Abordagem';
      default: return 'Questão';
    }
  };

  const getScoreMessage = () => {
    const percentage = (score / TRAINING_QUESTIONS.length) * 100;
    if (percentage >= 90) return { message: 'Excelente! Você é um expert em neurovendas!', color: 'text-success' };
    if (percentage >= 70) return { message: 'Muito bom! Continue praticando para dominar.', color: 'text-info' };
    if (percentage >= 50) return { message: 'Bom começo! Revise os conceitos e tente novamente.', color: 'text-warning' };
    return { message: 'Continue estudando! A prática leva à perfeição.', color: 'text-accent' };
  };

  if (!isTraining) {
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Neuro Training Mode</CardTitle>
              <p className="text-xs text-muted-foreground">
                Aprenda a identificar e responder a cada sistema cerebral
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Brain systems overview */}
          <div className="grid grid-cols-3 gap-2">
            {(['reptilian', 'limbic', 'neocortex'] as BrainSystem[]).map(brain => {
              const info = BRAIN_SYSTEM_INFO[brain];
              return (
                <motion.div
                  key={brain}
                  whileHover={{ scale: 1.02 }}
                  className="p-3 rounded-lg border text-center"
                  style={{ borderColor: `${info.color}40` }}
                >
                  <div 
                    className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${info.color}20` }}
                  >
                    {info.icon}
                  </div>
                  <p className="text-sm font-medium">{info.namePt}</p>
                  <p className="text-xs text-muted-foreground">{info.mainFunction}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Training info */}
          <div className="p-4 rounded-lg bg-accent/50 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              O que você vai aprender:
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>Identificar qual sistema cerebral está dominando</li>
              <li>Reconhecer os 6 estímulos primais em ação</li>
              <li>Escolher a abordagem certa para cada perfil</li>
              <li>Aplicar neurovendas na prática</li>
            </ul>
          </div>

          <Button 
            onClick={handleStartTraining}
            className="w-full gap-2"
          >
            <Play className="h-4 w-4" />
            Iniciar Treinamento ({TRAINING_QUESTIONS.length} questões)
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Training complete
  if (isComplete || (currentQuestionIndex + 1 > TRAINING_QUESTIONS.length && !showResult)) {
    const scoreInfo = getScoreMessage();
    const percentage = (score / TRAINING_QUESTIONS.length) * 100;
    
    return (
      <Card className={cn("border-primary/20", className)}>
        <CardContent className="pt-6 space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex justify-center"
          >
            <div className="p-4 rounded-full bg-primary/10">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </motion.div>

          <div className="text-center">
            <h3 className="text-xl font-bold">Treinamento Completo!</h3>
            <p className={cn("text-sm mt-1", scoreInfo.color)}>
              {scoreInfo.message}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-accent/50 text-center">
            <p className="text-4xl font-bold text-primary">
              {score}/{TRAINING_QUESTIONS.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {percentage.toFixed(0)}% de acerto
            </p>
            <Progress value={percentage} className="mt-2" />
          </div>

          <Button 
            onClick={handleRestart}
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Treinar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Neuro Training</CardTitle>
              <p className="text-xs text-muted-foreground">
                Questão {currentQuestionIndex + 1} de {TRAINING_QUESTIONS.length}
              </p>
            </div>
          </div>
          <Badge variant="outline">
            {score} pontos
          </Badge>
        </div>
        <Progress value={progress} className="mt-3" />
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!showLearning ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Question type badge */}
              <Badge variant="secondary" className="gap-1">
                <Brain className="h-3 w-3" />
                {getQuestionTypeLabel(currentQuestion.type)}
              </Badge>

              {/* Scenario */}
              <div className="p-4 rounded-lg bg-accent/50">
                <p className="text-sm">{currentQuestion.scenario}</p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.id;
                  const showCorrectness = showResult;
                  
                  return (
                    <motion.button
                      key={option.id}
                      whileHover={!showResult ? { scale: 1.01 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                      onClick={() => handleSelectAnswer(option.id)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        isSelected && !showResult && "border-primary bg-primary/5",
                        showCorrectness && option.isCorrect && "border-success bg-success/10",
                        showCorrectness && isSelected && !option.isCorrect && "border-destructive bg-destructive/10",
                        !isSelected && !showResult && "hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{option.label}</span>
                        {showCorrectness && option.isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                        {showCorrectness && isSelected && !option.isCorrect && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      {showCorrectness && (isSelected || option.isCorrect) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {option.explanation}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Hint */}
              {!showResult && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 text-warning dark:text-warning">
                  <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">{currentQuestion.hint}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {!showResult ? (
                  <Button 
                    onClick={handleConfirmAnswer}
                    disabled={!selectedAnswer}
                    className="w-full"
                  >
                    Confirmar Resposta
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextQuestion}
                    className="w-full gap-2"
                  >
                    Ver Aprendizado
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="learning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Ponto de Aprendizado</h4>
                </div>
                <p className="text-sm">{currentQuestion.learningPoint}</p>
              </div>

              <Button 
                onClick={handleNextQuestion}
                className="w-full gap-2"
              >
                {currentQuestionIndex + 1 < TRAINING_QUESTIONS.length ? (
                  <>
                    Próxima Questão
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ver Resultado Final
                    <Trophy className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default NeuroTrainingMode;
