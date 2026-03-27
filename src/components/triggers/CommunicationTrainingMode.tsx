import { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Brain,
  BookOpen,
  Play,
  Trophy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISCProfile, DISC_LABELS } from '@/types';
import { VAKType } from '@/types/vak';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { SalespersonProfile } from './communicationTrainingData';
import { generateScenarios } from './communicationTrainingData';
import { TrainingTipsTab } from './TrainingTipsTab';
import { TrainingPracticeTab } from './TrainingPracticeTab';
import { TrainingProgressTab } from './TrainingProgressTab';

export function CommunicationTrainingMode() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salespersonProfile, setSalespersonProfile] = useState<SalespersonProfile | null>(null);
  const [activeTab, setActiveTab] = useState('tips');
  const [selectedDISC, setSelectedDISC] = useState<DISCProfile>('D');
  const [selectedVAK, setSelectedVAK] = useState<VAKType>('V');
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nlp_profile')
        .eq('id', user.id)
        .single();

      if (!error && data?.nlp_profile) {
        setSalespersonProfile(data.nlp_profile as unknown as SalespersonProfile);
      }
    } catch (err) {
      logger.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = useMemo(() => {
    return generateScenarios(salespersonProfile?.discProfile || null);
  }, [salespersonProfile]);

  const currentScenarioData = scenarios[currentScenario];

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || !currentScenarioData) return;

    setShowResult(true);
    const selectedOption = currentScenarioData.options.find(o => o.id === selectedAnswer);

    if (selectedOption?.isCorrect) {
      setScore(prev => prev + 1);
      toast.success('Resposta correta! 🎉');
    } else {
      toast.error('Resposta incorreta. Veja a explicação.');
    }

    setCompletedScenarios(prev => [...prev, currentScenarioData.id]);
  };

  const handleNextScenario = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleResetTraining = () => {
    setCurrentScenario(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCompletedScenarios([]);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!salespersonProfile?.discProfile && !salespersonProfile?.vakProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Modo Treinamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              Configure seu perfil PNL para acessar o treinamento personalizado
            </p>
            <Button variant="outline" asChild>
              <a href="/configuracoes">Configurar Meu Perfil</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Modo Treinamento de Comunicação
        </CardTitle>
        <CardDescription>
          Aprenda a se comunicar melhor com perfis diferentes do seu
          {salespersonProfile?.discProfile && (
            <Badge variant="outline" className="ml-2">
              Seu perfil: {salespersonProfile.discProfile} - {DISC_LABELS[salespersonProfile.discProfile].name}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tips" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Dicas
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-2">
              <Play className="w-4 h-4" />
              Prática
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <Trophy className="w-4 h-4" />
              Progresso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-4">
            <TrainingTipsTab
              selectedDISC={selectedDISC}
              setSelectedDISC={setSelectedDISC}
              selectedVAK={selectedVAK}
              setSelectedVAK={setSelectedVAK}
              salespersonProfile={salespersonProfile}
            />
          </TabsContent>

          <TabsContent value="practice" className="space-y-4">
            <TrainingPracticeTab
              scenarios={scenarios}
              currentScenario={currentScenario}
              currentScenarioData={currentScenarioData}
              selectedAnswer={selectedAnswer}
              showResult={showResult}
              score={score}
              completedScenarios={completedScenarios}
              onAnswerSelect={handleAnswerSelect}
              onSubmitAnswer={handleSubmitAnswer}
              onNextScenario={handleNextScenario}
              onResetTraining={handleResetTraining}
            />
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <TrainingProgressTab
              score={score}
              completedScenarios={completedScenarios}
              scenarios={scenarios}
              salespersonProfile={salespersonProfile}
              onResetTraining={handleResetTraining}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
