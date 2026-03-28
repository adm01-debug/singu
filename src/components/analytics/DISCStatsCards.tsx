import { motion } from 'framer-motion';
import { Users, Target, Award, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DISCBadge } from '@/components/ui/disc-badge';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { DISCStats, DISC_COLORS } from './DISCAnalyticsTypes';

interface DISCStatsCardsProps {
  stats: DISCStats;
}

export const DISCStatsCards = ({ stats }: DISCStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-primary" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.totalProfiled}</p>
            <p className="text-sm text-muted-foreground">Contatos perfilados</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <Target className="w-8 h-8 text-emerald-500" />
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                {stats.avgConfidence}%
              </Badge>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.avgConfidence}%</p>
            <p className="text-sm text-muted-foreground">Confianca media</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <Award className="w-8 h-8" style={{ color: DISC_COLORS[stats.mostCommon || 'I'] }} />
              <DISCBadge profile={stats.mostCommon} size="sm" />
            </div>
            <p className="text-3xl font-bold mt-2">
              {DISC_PROFILES[stats.mostCommon || 'I']?.name}
            </p>
            <p className="text-sm text-muted-foreground">Perfil predominante</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <Activity className="w-8 h-8 text-purple-500" />
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600">
                7 dias
              </Badge>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.recentAnalyses}</p>
            <p className="text-sm text-muted-foreground">Analises recentes</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
