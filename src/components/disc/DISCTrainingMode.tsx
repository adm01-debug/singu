// ==============================================
// DISC Training Mode - Interactive Practice Scenarios
// Enterprise Level Component (Orchestrator)
// ==============================================

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Star } from 'lucide-react';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import confetti from 'canvas-confetti';
import { TrainingProgress, TRAINING_SCENARIOS } from './discTrainingData';
import { TrainingComplete } from './TrainingComplete';
import {
  ScenarioHeader,
  OptionList,
  ResultPanel,
  ScenarioActions
} from './TrainingScenarioView';

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
      <TrainingComplete
        progress={progress}
        accuracy={accuracy}
        onRestart={handleRestart}
      />
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
        {currentScenario && (
          <>
            <ScenarioHeader
              scenario={currentScenario}
              profileColor={profileInfo?.color ? { bg: profileInfo.color.bg, text: profileInfo.color.text } : undefined}
            />

            <OptionList
              options={currentScenario.options}
              selectedOption={selectedOption}
              showResult={showResult}
              onSelectOption={handleSelectOption}
            />

            {showResult && selectedOptionData && (
              <ResultPanel
                showResult={showResult}
                isCorrect={selectedOptionData.isCorrect}
                explanation={selectedOptionData.explanation}
                learningPoint={currentScenario.learningPoint}
              />
            )}

            <ScenarioActions
              showResult={showResult}
              selectedOption={selectedOption}
              isLastScenario={currentScenarioIndex >= TRAINING_SCENARIOS.length - 1}
              onSubmit={handleSubmit}
              onNext={handleNextScenario}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DISCTrainingMode;
