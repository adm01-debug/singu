import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Trophy, Target, Medal, Users, Flame, Star,
  TrendingUp, Award, Crown, Zap, CheckCircle2,
  Clock, BarChart3, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  useUserGoals, useGoalsDashboard, useQuotaStatus,
  useLeaderboard, useUserBadges, useCheckAndAwardBadges,
  type UserGoal, type QuotaStatus as QuotaStatusType,
  type LeaderboardEntry, type UserBadge
} from '@/hooks/useGamification';

// ── Badge rarity config ──
const RARITY_CONFIG = {
  common: { label: 'Comum', color: 'bg-muted text-muted-foreground', border: 'border-border' },
  rare: { label: 'Raro', color: 'bg-info/10 text-info', border: 'border-info/30' },
  epic: { label: 'Épico', color: 'bg-primary/10 text-primary', border: 'border-primary/30' },
  legendary: { label: 'Lendário', color: 'bg-warning/10 text-warning', border: 'border-warning/30' },
};

// ── Goal status config ──
const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed: { icon: CheckCircle2, color: 'text-success' },
  in_progress: { icon: TrendingUp, color: 'text-primary' },
  behind: { icon: Clock, color: 'text-warning' },
  not_started: { icon: Target, color: 'text-muted-foreground' },
};

export default function Metas() {
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('month');
  const { data: goals, isLoading: goalsLoading } = useUserGoals();
  const { data: dashboard, isLoading: dashLoading } = useGoalsDashboard();
  const { data: quotas, isLoading: quotaLoading } = useQuotaStatus();
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(leaderboardPeriod);
  const { data: badges, isLoading: badgesLoading } = useUserBadges();
  const checkBadges = useCheckAndAwardBadges();

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-br from-warning/20 to-primary/20">
            <Trophy className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Metas & Gamificação</h1>
            <p className="text-muted-foreground text-sm">Acompanhe seu progresso e conquistas</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => checkBadges.mutate()}
          disabled={checkBadges.isPending}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", checkBadges.isPending && "animate-spin")} />
          Verificar Conquistas
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Target}
          label="Metas Ativas"
          value={dashboard?.in_progress_goals ?? 0}
          subtitle={`${dashboard?.total_goals ?? 0} total`}
          loading={dashLoading}
          color="text-primary"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Concluídas"
          value={dashboard?.completed_goals ?? 0}
          subtitle={`${(dashboard?.completion_rate ?? 0).toFixed(0)}% taxa`}
          loading={dashLoading}
          color="text-success"
        />
        <KpiCard
          icon={Flame}
          label="Sequência"
          value={dashboard?.streak_days ?? 0}
          subtitle="dias seguidos"
          loading={dashLoading}
          color="text-warning"
        />
        <KpiCard
          icon={Medal}
          label="Conquistas"
          value={badges?.length ?? 0}
          subtitle="badges ganhos"
          loading={badgesLoading}
          color="text-accent-foreground"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals" className="gap-1.5">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Metas</span>
          </TabsTrigger>
          <TabsTrigger value="quotas" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Cotas</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-1.5">
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Ranking</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-1.5">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Conquistas</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Goals Tab ── */}
        <TabsContent value="goals" className="mt-6">
          {goalsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
            </div>
          ) : goals && goals.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {goals.map((goal, i) => (
                  <GoalCard key={goal.id} goal={goal} index={i} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState icon={Target} message="Nenhuma meta definida ainda" />
          )}
        </TabsContent>

        {/* ── Quotas Tab ── */}
        <TabsContent value="quotas" className="mt-6">
          {quotaLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-lg" />)}
            </div>
          ) : quotas && quotas.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {quotas.map((quota, i) => (
                <QuotaCard key={quota.quota_id} quota={quota} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState icon={BarChart3} message="Nenhuma cota configurada" />
          )}
        </TabsContent>

        {/* ── Leaderboard Tab ── */}
        <TabsContent value="leaderboard" className="mt-6 space-y-4">
          <div className="flex gap-2">
            {['week', 'month', 'quarter', 'year'].map(p => (
              <Button
                key={p}
                size="sm"
                variant={leaderboardPeriod === p ? 'default' : 'outline'}
                onClick={() => setLeaderboardPeriod(p)}
                className="text-xs"
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : 'Ano'}
              </Button>
            ))}
          </div>
          {lbLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <LeaderboardRow key={entry.user_id} entry={entry} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Crown} message="Nenhum dado de ranking disponível" />
          )}
        </TabsContent>

        {/* ── Badges Tab ── */}
        <TabsContent value="badges" className="mt-6">
          {badgesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
            </div>
          ) : badges && badges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {badges.map((badge, i) => (
                  <BadgeCard key={badge.id} badge={badge} index={i} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState icon={Award} message="Nenhuma conquista ainda. Continue jogando!" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ──

function KpiCard({ icon: Icon, label, value, subtitle, loading, color }: {
  icon: typeof Target; label: string; value: number; subtitle: string; loading: boolean; color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        {loading ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl bg-muted/50", color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground/70">{subtitle}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoalCard({ goal, index }: { goal: UserGoal; index: number }) {
  const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.not_started;
  const StatusIcon = cfg.icon;
  const progressColor = goal.progress_pct >= 100 ? 'text-success' : goal.progress_pct >= 60 ? 'text-primary' : 'text-warning';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <StatusIcon className={cn("h-4 w-4", cfg.color)} />
              {goal.title}
            </CardTitle>
            <Badge variant="outline" className="text-[10px] shrink-0">{goal.period}</Badge>
          </div>
          {goal.description && (
            <CardDescription className="text-xs">{goal.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{goal.current_value} / {goal.target_value}</span>
            <span className={cn("font-bold", progressColor)}>{goal.progress_pct.toFixed(0)}%</span>
          </div>
          <Progress value={Math.min(goal.progress_pct, 100)} className="h-2" />
          {goal.due_date && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Prazo: {new Date(goal.due_date).toLocaleDateString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuotaCard({ quota, index }: { quota: QuotaStatusType; index: number }) {
  const pct = Math.min(quota.percentage, 100);
  const color = quota.on_track ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{quota.quota_name}</CardTitle>
            <Badge variant={quota.on_track ? 'default' : 'outline'} className="text-[10px]">
              {quota.on_track ? '✓ No alvo' : '⚠ Atenção'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold">{quota.achieved.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground">de {quota.target.toLocaleString('pt-BR')}</p>
            </div>
            <p className={cn("text-lg font-bold", color)}>{quota.percentage.toFixed(0)}%</p>
          </div>
          <Progress value={pct} className="h-2.5" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Faltam: {quota.remaining.toLocaleString('pt-BR')}</span>
            <span>{quota.period}</span>
          </div>
          {quota.projected_value != null && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Projetado: {quota.projected_value.toLocaleString('pt-BR')}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LeaderboardRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const isTop3 = entry.rank <= 3;
  const rankIcons = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className={cn(
        "overflow-hidden transition-colors",
        isTop3 && "border-warning/20 bg-warning/5"
      )}>
        <CardContent className="py-3 px-4 flex items-center gap-4">
          <div className="w-8 text-center shrink-0">
            {isTop3 ? (
              <span className="text-xl">{rankIcons[entry.rank as 1|2|3]}</span>
            ) : (
              <span className="text-sm font-bold text-muted-foreground">#{entry.rank}</span>
            )}
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-warning/20 flex items-center justify-center shrink-0">
            {entry.avatar_url ? (
              <img src={entry.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{entry.user_name}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{entry.deals_closed} deals</span>
              <span>·</span>
              <span>R$ {entry.revenue.toLocaleString('pt-BR')}</span>
              {entry.badges_count > 0 && (
                <>
                  <span>·</span>
                  <span>{entry.badges_count} 🏅</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">{entry.score}</p>
            <p className="text-[10px] text-muted-foreground">pontos</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function BadgeCard({ badge, index }: { badge: UserBadge; index: number }) {
  const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring' }}
    >
      <Card className={cn("text-center overflow-hidden border-2", rarity.border)}>
        <CardContent className="py-5 px-3 space-y-2">
          <div className="text-4xl">{badge.badge_icon || '🏆'}</div>
          <p className="text-sm font-bold">{badge.badge_name}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">{badge.description}</p>
          <Badge className={cn("text-[9px]", rarity.color)}>{rarity.label}</Badge>
          <p className="text-[9px] text-muted-foreground">
            {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: typeof Target; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-12 w-12 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
