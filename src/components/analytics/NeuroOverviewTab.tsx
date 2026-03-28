// ==============================================
// NEURO OVERVIEW TAB - KPI Cards & Strategy Radar
// ==============================================

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  Brain,
  Heart,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { BrainSystem } from '@/types/neuromarketing';

interface NeuroOverviewTabProps {
  brainDistribution: Record<BrainSystem, { count: number; contacts: string[] }>;
  profileCoverage: number;
  strategyRadarData: Array<{ strategy: string; value: number; fullMark: number }>;
}

export const NeuroOverviewTab = ({
  brainDistribution,
  profileCoverage,
  strategyRadarData
}: NeuroOverviewTabProps) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium">Reptiliano</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{brainDistribution.reptilian.count}</p>
          <p className="text-xs text-muted-foreground">Foco em segurança</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span className="text-sm font-medium">Límbico</span>
          </div>
          <p className="text-2xl font-bold text-pink-600">{brainDistribution.limbic.count}</p>
          <p className="text-xs text-muted-foreground">Foco emocional</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Neocórtex</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{brainDistribution.neocortex.count}</p>
          <p className="text-xs text-muted-foreground">Foco analítico</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Cobertura</span>
          </div>
          <p className="text-2xl font-bold text-primary">{profileCoverage}%</p>
          <p className="text-xs text-muted-foreground">Contatos perfilados</p>
        </motion.div>
      </div>

      {/* Strategy Radar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Estratégias Recomendadas para o Portfólio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={strategyRadarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="strategy"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Relevância"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
