import { motion } from 'framer-motion';
import {
  Brain,
  Heart,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { NLPStats } from './NLPAnalyticsTypes';

interface NLPSummaryStatsProps {
  stats: NLPStats;
}

const statCards = [
  {
    key: 'analyses',
    icon: Brain,
    iconClass: 'text-primary',
    bgClass: 'bg-primary/10',
    label: 'Análises PNL',
    getValue: (stats: NLPStats) => stats.totalAnalyses,
    delay: 0.1,
  },
  {
    key: 'emotions',
    icon: Heart,
    iconClass: 'text-pink-500',
    bgClass: 'bg-pink-500/10',
    label: 'Estados Emocionais',
    getValue: (stats: NLPStats) => stats.emotionalStates.length,
    delay: 0.2,
  },
  {
    key: 'values',
    icon: Sparkles,
    iconClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    label: 'Valores Únicos',
    getValue: (stats: NLPStats) => stats.topValues.length,
    delay: 0.3,
  },
  {
    key: 'objections',
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
    label: 'Objeções Detectadas',
    getValue: (stats: NLPStats) => stats.objectionTypes.reduce((a, b) => a + b.count, 0),
    delay: 0.4,
  },
] as const;

export function NLPSummaryStats({ stats }: NLPSummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay }}
          >
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${card.bgClass}`}>
                    <Icon className={`w-5 h-5 ${card.iconClass}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.getValue(stats)}</p>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
