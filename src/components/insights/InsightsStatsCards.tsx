import { motion } from 'framer-motion';
import { Brain, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AIInsight } from './types';

interface InsightsStatsCardsProps {
  insights: AIInsight[];
}

export const InsightsStatsCards = ({ insights }: InsightsStatsCardsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{insights.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {insights.filter(i => i.category === 'opportunity').length}
            </p>
            <p className="text-sm text-muted-foreground">Oportunidades</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {insights.filter(i => i.category === 'risk').length}
            </p>
            <p className="text-sm text-muted-foreground">Riscos</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {insights.filter(i => i.actionable).length}
            </p>
            <p className="text-sm text-muted-foreground">Acionáveis</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
