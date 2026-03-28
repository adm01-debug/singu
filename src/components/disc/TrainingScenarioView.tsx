// ==============================================
// DISC Training Mode - Scenario Display Components
// ==============================================

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Check, X, ChevronRight,
  MessageSquare, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrainingScenario } from './discTrainingData';

// --- Scenario Header ---

interface ScenarioHeaderProps {
  scenario: TrainingScenario;
  profileColor?: { bg: string; text: string };
}

export const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({
  scenario,
  profileColor
}) => {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Badge
          style={{
            backgroundColor: profileColor?.bg || 'hsl(var(--muted))',
            color: profileColor?.text || 'hsl(var(--foreground))'
          }}
        >
          Perfil {scenario.profile}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {scenario.situation}
        </span>
      </div>
      <div className="bg-background rounded-lg p-4 border">
        <MessageSquare className="w-4 h-4 text-muted-foreground mb-2" />
        <p className="text-lg italic">
          "{scenario.clientStatement}"
        </p>
      </div>
    </div>
  );
};

// --- Option List ---

interface OptionListProps {
  options: TrainingScenario['options'];
  selectedOption: string | null;
  showResult: boolean;
  onSelectOption: (optionId: string) => void;
}

export const OptionList: React.FC<OptionListProps> = ({
  options,
  selectedOption,
  showResult,
  onSelectOption
}) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Como você responde?</h4>
      {options.map((option, idx) => {
        const isSelected = selectedOption === option.id;
        const showCorrect = showResult && option.isCorrect;
        const showWrong = showResult && isSelected && !option.isCorrect;

        return (
          <motion.button
            key={option.id}
            onClick={() => onSelectOption(option.id)}
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
  );
};

// --- Result Panel ---

interface ResultPanelProps {
  showResult: boolean;
  isCorrect: boolean;
  explanation: string;
  learningPoint: string;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  showResult,
  isCorrect,
  explanation,
  learningPoint
}) => {
  return (
    <AnimatePresence>
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${
            isCorrect
              ? 'bg-green-500/10 border border-green-500/30'
              : 'bg-red-500/10 border border-red-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isCorrect ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
              {isCorrect ? <Check /> : <X />}
            </div>
            <div className="flex-1">
              <p className="font-medium mb-1">
                {isCorrect ? 'Excelente!' : 'Não é a melhor opção'}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {explanation}
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-muted-foreground">
                  {learningPoint}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Action Buttons ---

interface ScenarioActionsProps {
  showResult: boolean;
  selectedOption: string | null;
  isLastScenario: boolean;
  onSubmit: () => void;
  onNext: () => void;
}

export const ScenarioActions: React.FC<ScenarioActionsProps> = ({
  showResult,
  selectedOption,
  isLastScenario,
  onSubmit,
  onNext
}) => {
  return (
    <div className="flex justify-end gap-2">
      {!showResult ? (
        <Button
          onClick={onSubmit}
          disabled={!selectedOption}
          className="gap-2"
        >
          Confirmar Resposta
          <ChevronRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={onNext}
          className="gap-2"
        >
          {isLastScenario ? 'Ver Resultados' : 'Próximo Cenário'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
