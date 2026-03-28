// ==============================================
// DISC Training Mode - Completion Screen
// ==============================================

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { TrainingProgress } from './discTrainingData';

interface TrainingCompleteProps {
  progress: TrainingProgress;
  accuracy: number;
  onRestart: () => void;
}

export const TrainingComplete: React.FC<TrainingCompleteProps> = ({
  progress,
  accuracy,
  onRestart
}) => {
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

        <Button onClick={onRestart} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reiniciar Treinamento
        </Button>
      </CardContent>
    </Card>
  );
};
