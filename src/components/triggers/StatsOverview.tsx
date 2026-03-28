import {
  Users,
  Crown,
  Star,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PortfolioStats, LEVEL_CONFIG } from './portfolio-compatibility-types';

export function StatsOverview({ stats }: { stats: PortfolioStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className="p-3 rounded-lg bg-muted/50 text-center">
        <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-xs text-muted-foreground">Total</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.excellent.bgColor)}>
        <Crown className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
        <p className="text-2xl font-bold text-emerald-600">{stats.excellent}</p>
        <p className="text-xs text-muted-foreground">Excelentes</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.good.bgColor)}>
        <Star className="w-5 h-5 mx-auto mb-1 text-blue-600" />
        <p className="text-2xl font-bold text-blue-600">{stats.good}</p>
        <p className="text-xs text-muted-foreground">Boas</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.moderate.bgColor)}>
        <Zap className="w-5 h-5 mx-auto mb-1 text-amber-600" />
        <p className="text-2xl font-bold text-amber-600">{stats.moderate}</p>
        <p className="text-xs text-muted-foreground">Moderadas</p>
      </div>
      <div className={cn('p-3 rounded-lg text-center', LEVEL_CONFIG.challenging.bgColor)}>
        <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-red-600" />
        <p className="text-2xl font-bold text-red-600">{stats.challenging}</p>
        <p className="text-xs text-muted-foreground">Desafiadoras</p>
      </div>
    </div>
  );
}
