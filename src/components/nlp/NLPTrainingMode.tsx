// ==============================================
// NLP Training Mode - Interactive Learning System
// Enterprise Level Component for VAK & Metaprogram Mastery
// ==============================================

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GraduationCap, Eye, Ear, Hand, Brain, Target, Shield,
  CheckCircle, XCircle, RefreshCw, Lightbulb, Star,
  ChevronRight, Zap, Trophy, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VAK_LABELS, VAKType, VAK_COMMUNICATION_TIPS } from '@/types/vak';
import { METAPROGRAM_LABELS } from '@/types/metaprograms';
import { toast } from 'sonner';

type TrainingType = 'vak_detection' | 'vak_adaptation' | 'meta_detection' | 'meta_adaptation' | 'combined';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

interface TrainingScenario {
  id: string;
  type: TrainingType;
  difficulty: Difficulty;
  title: string;
  context: string;
  clientStatement: string;
  correctAnswer: string;
  options: { id: string; label: string; isCorrect: boolean; explanation: string }[];
  learningPoint: string;
  adaptedResponse?: string;
}

const TRAINING_SCENARIOS: TrainingScenario[] = [
  // VAK Detection Scenarios
  {
    id: 'vak-1',
    type: 'vak_detection',
    difficulty: 'beginner',
    title: 'Identificação VAK Básica',
    context: 'Um cliente está descrevendo seu problema atual.',
    clientStatement: '"Eu vejo que a situação está ficando cada vez mais clara para mim. Preciso ter uma visão geral do panorama antes de decidir."',
    correctAnswer: 'V',
    options: [
      { id: 'V', label: 'Visual', isCorrect: true, explanation: 'Correto! Palavras como "vejo", "clara", "visão", "panorama" são predicados visuais.' },
      { id: 'A', label: 'Auditivo', isCorrect: false, explanation: 'Incorreto. Predicados auditivos seriam: "ouvir", "som", "harmonia", "conversar".' },
      { id: 'K', label: 'Cinestésico', isCorrect: false, explanation: 'Incorreto. Predicados cinestésicos seriam: "sentir", "tocar", "sólido", "confortável".' },
      { id: 'D', label: 'Digital', isCorrect: false, explanation: 'Incorreto. Predicados digitais seriam: "analisar", "dados", "lógico", "processo".' }
    ],
    learningPoint: 'Pessoas Visuais processam informações em imagens. Use gráficos, apresentações visuais e palavras como "mostrar", "claro", "perspectiva".',
    adaptedResponse: '"Deixa eu te mostrar uma visão completa do que podemos fazer. Vai ficar bem claro como isso se encaixa no seu panorama."'
  },
  {
    id: 'vak-2',
    type: 'vak_detection',
    difficulty: 'beginner',
    title: 'Detectando Auditivos',
    context: 'Cliente em uma reunião de apresentação.',
    clientStatement: '"Isso soa interessante. Me conta mais sobre como funciona. Quero ouvir os detalhes antes de dizer algo."',
    correctAnswer: 'A',
    options: [
      { id: 'V', label: 'Visual', isCorrect: false, explanation: 'Incorreto. Não há predicados visuais nessa fala.' },
      { id: 'A', label: 'Auditivo', isCorrect: true, explanation: 'Correto! "Soa", "conta", "ouvir", "dizer" são predicados auditivos.' },
      { id: 'K', label: 'Cinestésico', isCorrect: false, explanation: 'Incorreto. Predicados cinestésicos envolvem toque e sensações.' },
      { id: 'D', label: 'Digital', isCorrect: false, explanation: 'Incorreto. Predicados digitais envolvem lógica e análise.' }
    ],
    learningPoint: 'Pessoas Auditivas valorizam o tom de voz e precisam "ouvir" as informações. Prefira ligações a emails e varie seu tom.',
    adaptedResponse: '"Vou te contar em detalhes como isso funciona. Escuta só..."'
  },
  {
    id: 'vak-3',
    type: 'vak_detection',
    difficulty: 'beginner',
    title: 'Reconhecendo Cinestésicos',
    context: 'Cliente avaliando uma proposta.',
    clientStatement: '"Preciso sentir que essa é a decisão certa. Ainda estou pesando os prós e contras, mas meu feeling é positivo."',
    correctAnswer: 'K',
    options: [
      { id: 'V', label: 'Visual', isCorrect: false, explanation: 'Incorreto. Não há palavras visuais.' },
      { id: 'A', label: 'Auditivo', isCorrect: false, explanation: 'Incorreto. Não há palavras auditivas.' },
      { id: 'K', label: 'Cinestésico', isCorrect: true, explanation: 'Correto! "Sentir", "pesando", "feeling" são predicados cinestésicos.' },
      { id: 'D', label: 'Digital', isCorrect: false, explanation: 'Incorreto. Apesar de mencionar "prós e contras", o foco é no sentimento.' }
    ],
    learningPoint: 'Cinestésicos decidem com base em sentimentos e sensações. Dê tempo, construa relacionamento, use linguagem emocional.',
    adaptedResponse: '"Entendo que você quer se sentir seguro. Vamos construir isso juntos, passo a passo, até você ter a certeza no coração."'
  },
  {
    id: 'vak-4',
    type: 'vak_detection',
    difficulty: 'intermediate',
    title: 'Identificando Digitais',
    context: 'Cliente técnico analisando solução.',
    clientStatement: '"Preciso entender a lógica por trás disso. Quais são os dados que comprovam essa afirmação? Me passa um comparativo."',
    correctAnswer: 'D',
    options: [
      { id: 'V', label: 'Visual', isCorrect: false, explanation: 'Incorreto. Não há predicados visuais.' },
      { id: 'A', label: 'Auditivo', isCorrect: false, explanation: 'Incorreto. Não há predicados auditivos.' },
      { id: 'K', label: 'Cinestésico', isCorrect: false, explanation: 'Incorreto. Não há predicados cinestésicos.' },
      { id: 'D', label: 'Digital', isCorrect: true, explanation: 'Correto! "Entender", "lógica", "dados", "comparativo" são predicados digitais (auditivo digital).' }
    ],
    learningPoint: 'Digitais processam através de lógica e análise. Forneça dados, estatísticas, ROI e processos claros.',
    adaptedResponse: '"Vou te passar os dados completos. Analisando os números, o processo funciona assim..."'
  },
  // Metaprogram Detection
  {
    id: 'meta-1',
    type: 'meta_detection',
    difficulty: 'beginner',
    title: 'Motivação: Em Direção A',
    context: 'Entendendo o que motiva o cliente.',
    clientStatement: '"Quero conquistar novos mercados e alcançar um faturamento 50% maior. Meu objetivo é ser líder do segmento."',
    correctAnswer: 'toward',
    options: [
      { id: 'toward', label: 'Em Direção A (Ganhos)', isCorrect: true, explanation: 'Correto! "Conquistar", "alcançar", "objetivo" indicam motivação por ganhos.' },
      { id: 'away', label: 'Afastar-se De (Evitar)', isCorrect: false, explanation: 'Incorreto. Cliente focado em evitar diria "preciso resolver", "eliminar problemas".' }
    ],
    learningPoint: 'Pessoas "Em Direção A" são motivadas por metas e conquistas. Foque nos ganhos e benefícios.',
    adaptedResponse: '"Com nossa solução, você vai conquistar esses mercados mais rápido e alcançar sua meta de faturamento."'
  },
  {
    id: 'meta-2',
    type: 'meta_detection',
    difficulty: 'beginner',
    title: 'Motivação: Afastar-se De',
    context: 'Cliente descrevendo situação atual.',
    clientStatement: '"Preciso resolver esse problema de produtividade. Não aguento mais perder dinheiro com retrabalho. Quero eliminar esses erros."',
    correctAnswer: 'away',
    options: [
      { id: 'toward', label: 'Em Direção A (Ganhos)', isCorrect: false, explanation: 'Incorreto. O foco está em problemas a evitar, não em ganhos.' },
      { id: 'away', label: 'Afastar-se De (Evitar)', isCorrect: true, explanation: 'Correto! "Resolver", "não aguento", "perder", "eliminar" indicam motivação por evitar dor.' }
    ],
    learningPoint: 'Pessoas "Afastar-se De" são motivadas por evitar problemas. Mostre o que vão evitar ou resolver.',
    adaptedResponse: '"Vamos eliminar esses erros de produtividade e você vai parar de perder dinheiro com retrabalho."'
  },
  {
    id: 'meta-3',
    type: 'meta_detection',
    difficulty: 'intermediate',
    title: 'Referência: Interna',
    context: 'Processo de decisão do cliente.',
    clientStatement: '"Eu sei o que funciona para mim. Na minha avaliação, isso faz sentido. Vou decidir baseado no meu critério."',
    correctAnswer: 'internal',
    options: [
      { id: 'internal', label: 'Referência Interna', isCorrect: true, explanation: 'Correto! "Eu sei", "minha avaliação", "meu critério" indicam referência interna.' },
      { id: 'external', label: 'Referência Externa', isCorrect: false, explanation: 'Incorreto. Referência externa buscaria "o que outros dizem", "pesquisas mostram".' }
    ],
    learningPoint: 'Pessoas com referência interna decidem por si. Não force opiniões, deixe-os chegar às próprias conclusões.',
    adaptedResponse: '"Você vai perceber por si mesmo como isso se encaixa no que você busca."'
  },
  {
    id: 'meta-4',
    type: 'meta_detection',
    difficulty: 'intermediate',
    title: 'Referência: Externa',
    context: 'Cliente buscando validação.',
    clientStatement: '"O que outras empresas do setor estão fazendo? Tem algum caso de sucesso? Quero ver o que os especialistas dizem."',
    correctAnswer: 'external',
    options: [
      { id: 'internal', label: 'Referência Interna', isCorrect: false, explanation: 'Incorreto. Cliente está buscando validação externa.' },
      { id: 'external', label: 'Referência Externa', isCorrect: true, explanation: 'Correto! "Outras empresas", "caso de sucesso", "especialistas" indicam referência externa.' }
    ],
    learningPoint: 'Pessoas com referência externa precisam de validação. Use depoimentos, cases e dados de mercado.',
    adaptedResponse: '"Empresas líderes do setor já usam. Deixa eu te mostrar o case da [Empresa] e o que os especialistas dizem."'
  },
  // Combined Advanced
  {
    id: 'combined-1',
    type: 'combined',
    difficulty: 'advanced',
    title: 'Análise Combinada',
    context: 'Identificar VAK + Metaprograma simultaneamente.',
    clientStatement: '"Preciso visualizar como vou evitar esses problemas no futuro. Me mostra um panorama de como isso vai proteger minha operação."',
    correctAnswer: 'V-away',
    options: [
      { id: 'V-toward', label: 'Visual + Em Direção A', isCorrect: false, explanation: 'VAK correto, mas metaprograma errado.' },
      { id: 'V-away', label: 'Visual + Afastar-se De', isCorrect: true, explanation: 'Correto! "Visualizar", "panorama" = Visual. "Evitar", "proteger" = Afastar-se De.' },
      { id: 'K-away', label: 'Cinestésico + Afastar-se De', isCorrect: false, explanation: 'Metaprograma correto, mas VAK errado.' },
      { id: 'A-toward', label: 'Auditivo + Em Direção A', isCorrect: false, explanation: 'Ambos incorretos.' }
    ],
    learningPoint: 'Na prática, combinamos múltiplos perfis. Visual + Afastar-se De: mostre visualmente os problemas que serão evitados.',
    adaptedResponse: '"Deixa eu te mostrar uma visão clara de como você vai evitar esses problemas. Olha esse panorama de proteção..."'
  }
];

const NLPTrainingMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrainingType>('vak_detection');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [practiceText, setPracticeText] = useState('');

  const filteredScenarios = useMemo(() => 
    TRAINING_SCENARIOS.filter(s => 
      (activeTab === 'combined' || s.type === activeTab) &&
      (difficulty === 'advanced' || s.difficulty === difficulty || s.difficulty === 'beginner')
    ),
  [activeTab, difficulty]);

  const currentScenario = filteredScenarios[currentScenarioIndex % filteredScenarios.length];

  const handleAnswer = () => {
    if (!selectedAnswer || !currentScenario) return;
    
    setShowResult(true);
    const isCorrect = currentScenario.options.find(o => o.id === selectedAnswer)?.isCorrect;
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      toast.success('Correto! 🎉', { duration: 2000 });
    } else {
      toast.error('Não foi dessa vez', { duration: 2000 });
    }
  };

  const nextScenario = () => {
    setCurrentScenarioIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const resetTraining = () => {
    setCurrentScenarioIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
  };

  const selectedOption = currentScenario?.options.find(o => o.id === selectedAnswer);
  const progressPercent = score.total > 0 ? (score.correct / score.total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="w-5 h-5 text-primary" />
              Modo Treinamento PNL
            </CardTitle>
            <CardDescription>
              Aprenda a identificar e adaptar comunicação por perfil
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Trophy className="w-3 h-3" />
              {score.correct}/{score.total}
            </Badge>
            <Button variant="outline" size="sm" onClick={resetTraining}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reiniciar
            </Button>
          </div>
        </div>
        {score.total > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as TrainingType); resetTraining(); }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vak_detection" className="gap-1">
              <Eye className="w-3 h-3" />
              VAK
            </TabsTrigger>
            <TabsTrigger value="meta_detection" className="gap-1">
              <Target className="w-3 h-3" />
              Metaprogramas
            </TabsTrigger>
            <TabsTrigger value="combined" className="gap-1">
              <Zap className="w-3 h-3" />
              Combinado
            </TabsTrigger>
            <TabsTrigger value="vak_adaptation" className="gap-1">
              <BookOpen className="w-3 h-3" />
              Prática
            </TabsTrigger>
          </TabsList>

          {/* Detection Training */}
          <TabsContent value={activeTab} className="mt-4">
            {activeTab !== 'vak_adaptation' && currentScenario ? (
              <div className="space-y-4">
                {/* Difficulty Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Dificuldade:</span>
                  {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map(d => (
                    <Button
                      key={d}
                      size="sm"
                      variant={difficulty === d ? 'default' : 'outline'}
                      onClick={() => { setDifficulty(d); resetTraining(); }}
                    >
                      {d === 'beginner' ? 'Iniciante' : d === 'intermediate' ? 'Intermediário' : 'Avançado'}
                    </Button>
                  ))}
                </div>

                {/* Scenario Card */}
                <motion.div
                  key={currentScenario.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 rounded-lg border bg-muted/30"
                >
                  <Badge className="mb-2">{currentScenario.title}</Badge>
                  <p className="text-sm text-muted-foreground mb-3">{currentScenario.context}</p>
                  
                  <div className="p-4 rounded-lg bg-card border-l-4 border-primary mb-4">
                    <p className="italic text-foreground">{currentScenario.clientStatement}</p>
                  </div>

                  <p className="text-sm font-medium mb-3">Qual é o perfil dominante?</p>

                  <RadioGroup
                    value={selectedAnswer || ''}
                    onValueChange={setSelectedAnswer}
                    disabled={showResult}
                    className="space-y-2"
                  >
                    {currentScenario.options.map(option => (
                      <div
                        key={option.id}
                        className={cn(
                          'flex items-center space-x-2 p-3 rounded-lg border transition-colors',
                          showResult && option.isCorrect && 'bg-green-50 border-green-300 dark:bg-green-950',
                          showResult && !option.isCorrect && selectedAnswer === option.id && 'bg-red-50 border-red-300 dark:bg-red-950',
                          !showResult && selectedAnswer === option.id && 'bg-primary/10 border-primary'
                        )}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.label}
                        </Label>
                        {showResult && (
                          option.isCorrect ? 
                            <CheckCircle className="w-5 h-5 text-green-600" /> : 
                            selectedAnswer === option.id && <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                </motion.div>

                {/* Result & Explanation */}
                <AnimatePresence>
                  {showResult && selectedOption && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      <div className={cn(
                        'p-4 rounded-lg',
                        selectedOption.isCorrect ? 'bg-green-50 dark:bg-green-950' : 'bg-amber-50 dark:bg-amber-950'
                      )}>
                        <p className="text-sm">{selectedOption.explanation}</p>
                      </div>

                      <div className="p-4 rounded-lg bg-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-primary" />
                          <span className="font-medium text-sm">Dica de Comunicação</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{currentScenario.learningPoint}</p>
                      </div>

                      {currentScenario.adaptedResponse && (
                        <div className="p-4 rounded-lg bg-muted/50 border">
                          <p className="text-sm font-medium mb-1">Exemplo de resposta adaptada:</p>
                          <p className="text-sm italic text-muted-foreground">{currentScenario.adaptedResponse}</p>
                        </div>
                      )}

                      <Button onClick={nextScenario} className="w-full gap-2">
                        Próximo Cenário <ChevronRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showResult && (
                  <Button 
                    onClick={handleAnswer} 
                    disabled={!selectedAnswer}
                    className="w-full"
                  >
                    Confirmar Resposta
                  </Button>
                )}
              </div>
            ) : activeTab === 'vak_adaptation' ? (
              /* Practice Mode */
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <h4 className="font-medium mb-2">Modo Prática Livre</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Escreva uma mensagem e veja como adaptá-la para diferentes perfis VAK.
                  </p>
                  
                  <Textarea
                    placeholder="Digite uma mensagem de vendas para praticar..."
                    value={practiceText}
                    onChange={(e) => setPracticeText(e.target.value)}
                    rows={3}
                    className="mb-4"
                  />

                  {practiceText.length > 20 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium">Adaptações sugeridas:</h5>
                      
                      {(['V', 'A', 'K', 'D'] as VAKType[]).map(type => (
                        <div key={type} className={cn('p-3 rounded-lg border', VAK_LABELS[type].bgColor)}>
                          <div className="flex items-center gap-2 mb-1">
                            {type === 'V' && <Eye className="w-4 h-4" />}
                            {type === 'A' && <Ear className="w-4 h-4" />}
                            {type === 'K' && <Hand className="w-4 h-4" />}
                            {type === 'D' && <Brain className="w-4 h-4" />}
                            <span className="font-medium text-sm">{VAK_LABELS[type].name}</span>
                          </div>
                          <p className="text-sm">
                            Use: {VAK_COMMUNICATION_TIPS[type].useWords.slice(0, 5).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum cenário disponível para este filtro</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NLPTrainingMode;
