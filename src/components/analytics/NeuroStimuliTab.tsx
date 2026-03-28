// ==============================================
// NEURO STIMULI TAB - Primal Stimuli Ranking
// ==============================================

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Target } from 'lucide-react';
import { PrimalStimulus, PrimalStimulusInfo } from '@/types/neuromarketing';

interface PortfolioStimulusItem {
  stimulus: PrimalStimulus;
  count: number;
  info: PrimalStimulusInfo;
}

interface NeuroStimuliTabProps {
  portfolioStimuli: PortfolioStimulusItem[];
  totalContacts: number;
}

export const NeuroStimuliTab = ({
  portfolioStimuli,
  totalContacts
}: NeuroStimuliTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            6 Estímulos Primários - Ranking do Portfólio
          </CardTitle>
          <CardDescription>
            Estímulos mais efetivos para seu portfólio baseado em perfis DISC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {portfolioStimuli.map((item, index) => (
              <motion.div
                key={item.stimulus}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all
                  ${index === 0 ? 'bg-primary/10 border-primary ring-2 ring-primary' :
                    index === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                    'bg-muted/30'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{item.info.icon}</span>
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    #{index + 1}
                  </Badge>
                </div>
                <h4 className="font-semibold">{item.info.namePt}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {item.count} contatos respondem
                </p>
                <Progress
                  value={(item.count / (totalContacts || 1)) * 100}
                  className="h-1.5 mt-2"
                />
              </motion.div>
            ))}
          </div>

          {/* Top Stimulus Recommendation */}
          {portfolioStimuli[0] && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Recomendação Principal
              </h4>
              <p className="text-sm">
                Priorize comunicações com <strong>{portfolioStimuli[0].info.namePt}</strong> -
                {' '}{portfolioStimuli[0].info.descriptionPt}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {portfolioStimuli[0].info.applicationTips.slice(0, 2).map((tip, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-primary">→</span> {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
