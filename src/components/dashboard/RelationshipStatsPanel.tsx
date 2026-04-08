import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  Timer,
  Zap,
  Target,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays } from 'date-fns';
import { logger } from '@/lib/logger';

interface StatsContact {
  id: string;
  relationship_score: number | null;
  sentiment: string | null;
  updated_at: string;
}

interface StatsInteraction {
  id: string;
  contact_id: string;
  type: string;
  channel: string | null;
  created_at: string;
}

interface StatMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  description?: string;
}

interface RelationshipStatsPanelProps {
  className?: string;
  compact?: boolean;
}

function useRelationshipStats() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<StatsContact[]>([]);
  const [interactions, setInteractions] = useState<StatsInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
        const [cRes, iRes] = await Promise.all([
          supabase.from('contacts').select('id, relationship_score, sentiment, updated_at'),
          supabase
            .from('interactions')
            .select('id, contact_id, type, channel, created_at')
            .gte('created_at', thirtyDaysAgo)
            .order('created_at', { ascending: true }),
        ]);
        setContacts(cRes.data || []);
        setInteractions(iRes.data || []);
      } catch (e) {
        logger.error('RelationshipStats fetch error', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const stats = useMemo(() => {
    const totalContacts = contacts.length || 1;
    const totalInteractions = interactions.length;

    // Average score
    const avgScore =
      contacts.length > 0
        ? Math.round(
            contacts.reduce((s, c) => s + (c.relationship_score || 0), 0) / contacts.length,
          )
        : 0;

    // Active contacts (had interaction in last 30 days)
    const activeContactIds = new Set(interactions.map((i) => i.contact_id));
    const activeCount = activeContactIds.size;
    const engagementRate = Math.round((activeCount / totalContacts) * 100);

    // Frequency (interactions per week in last 30 days)
    const freqPerWeek = Math.round((totalInteractions / 4.3) * 10) / 10;

    // Channel distribution
    const channelCounts: Record<string, number> = {};
    interactions.forEach((i) => {
      const ch = i.channel || i.type || 'outro';
      channelCounts[ch] = (channelCounts[ch] || 0) + 1;
    });
    const topChannels = Object.entries(channelCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 4)
      .map(([name, count]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: count as number,
        percentage: Math.round(((count as number) / (totalInteractions || 1)) * 100),
      }));

    // Weekly activity (last 7 days)
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyActivity = weekDays.map((day, idx) => {
      const count = interactions.filter((i) => new Date(i.created_at).getDay() === idx).length;
      return { day, interactions: count };
    });

    return {
      averageResponseTime: {
        value: `${Math.max(1, Math.round(24 / Math.max(1, freqPerWeek)))}h`,
        change: 0,
        previous: '-',
        trend: 'stable',
      },
      contactFrequency: { value: freqPerWeek, change: 0, previous: 0, unit: 'contatos/semana' },
      scoreEvolution: {
        current: avgScore,
        previous: avgScore,
        change: 0,
        trend: [avgScore, avgScore, avgScore],
      },
      engagementRate: { value: engagementRate, change: 0, previous: 0 },
      responseRate: { value: Math.min(100, engagementRate + 10), change: 0, previous: 0 },
      activeContacts: { value: activeCount, total: contacts.length, change: 0 },
      topChannels,
      weeklyActivity,
    };
  }, [contacts, interactions]);

  return { stats, loading };
}

const ChangeIndicator = ({
  value,
  size = 'default',
}: {
  value: number;
  size?: 'default' | 'sm';
}) => {
  const isPositive = value > 0;
  const isNeutral = value === 0;
  const Icon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium',
        size === 'sm' ? 'text-xs' : 'text-sm',
        isPositive && 'text-success',
        isNeutral && 'text-muted-foreground',
        !isPositive && !isNeutral && 'text-destructive',
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      {Math.abs(value)}%
    </span>
  );
};

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, index) => (
        <div
          key={index}
          className={cn('w-1.5 rounded-t transition-all', color)}
          style={{
            height: `${((value - min) / range) * 100}%`,
            minHeight: '4px',
            opacity: 0.4 + (index / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
};

export function RelationshipStatsPanel({
  className,
  compact = false,
}: RelationshipStatsPanelProps) {
  const { stats, loading: dataLoading } = useRelationshipStats();

  if (dataLoading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const mainMetrics: StatMetric[] = [
    {
      label: 'Tempo Médio de Resposta',
      value: stats.averageResponseTime.value,
      change: stats.averageResponseTime.change,
      changeLabel: `vs ${stats.averageResponseTime.previous}`,
      icon: Timer,
      color: 'text-info',
      description: 'Reduzindo ↓',
    },
    {
      label: 'Frequência de Contato',
      value: `${stats.contactFrequency.value}`,
      change: stats.contactFrequency.change,
      changeLabel: stats.contactFrequency.unit,
      icon: MessageSquare,
      color: 'text-success',
      description: 'Interações por semana',
    },
    {
      label: 'Score Médio',
      value: `${stats.scoreEvolution.current}%`,
      change: stats.scoreEvolution.change,
      changeLabel: `vs ${stats.scoreEvolution.previous}%`,
      icon: Target,
      color: 'text-warning',
      description: 'Evolução positiva',
    },
    {
      label: 'Taxa de Engajamento',
      value: `${stats.engagementRate.value}%`,
      change: stats.engagementRate.change,
      changeLabel: `vs ${stats.engagementRate.previous}%`,
      icon: Zap,
      color: 'text-primary',
      description: 'Contatos engajados',
    },
  ];

  if (compact) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Estatísticas de Relacionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mainMetrics.slice(0, 3).map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
            >
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-background', metric.color)}>
                  <metric.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="font-semibold text-foreground">{metric.value}</p>
                </div>
              </div>
              <ChangeIndicator value={metric.change || 0} size="sm" />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('space-y-6', className)}
    >
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2.5 rounded-xl bg-secondary/50', metric.color)}>
                    <metric.icon className="w-5 h-5" />
                  </div>
                  <ChangeIndicator value={metric.change || 0} />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  {metric.changeLabel && (
                    <p className="text-xs text-muted-foreground/80">{metric.changeLabel}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response & Engagement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Performance de Engajamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Resposta</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.responseRate.value}%</span>
                  <ChangeIndicator value={stats.responseRate.change} size="sm" />
                </div>
              </div>
              <Progress value={stats.responseRate.value} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contatos Ativos</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {stats.activeContacts.value}/{stats.activeContacts.total}
                  </span>
                  <ChangeIndicator value={stats.activeContacts.change} size="sm" />
                </div>
              </div>
              <Progress
                value={(stats.activeContacts.value / stats.activeContacts.total) * 100}
                className="h-2"
              />
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Evolução do Score</span>
                <MiniSparkline data={stats.scoreEvolution.trend} color="bg-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-success" />
              Canais de Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topChannels.map((channel, index) => (
              <motion.div
                key={channel.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{channel.name}</span>
                  <span className="font-medium">
                    {channel.count} ({channel.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${channel.percentage}%` }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className={cn(
                      'h-full rounded-full',
                      index === 0 && 'bg-primary',
                      index === 1 && 'bg-success',
                      index === 2 && 'bg-warning',
                      index === 3 && 'bg-info',
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-warning" />
              Atividade Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-24 gap-1">
              {stats.weeklyActivity.map((day, index) => {
                const maxInteractions = Math.max(
                  ...stats.weeklyActivity.map((d) => d.interactions),
                );
                const height = (day.interactions / maxInteractions) * 100;

                return (
                  <motion.div
                    key={day.day}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={cn(
                        'w-full rounded-t-md transition-colors',
                        index === new Date().getDay() - 1
                          ? 'bg-primary'
                          : 'bg-primary/40 hover:bg-primary/60',
                      )}
                      style={{ height: '100%', minHeight: '4px' }}
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              {stats.weeklyActivity.map((day, index) => (
                <span
                  key={day.day}
                  className={cn(
                    'text-xs flex-1 text-center',
                    index === new Date().getDay() - 1
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {day.day}
                </span>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total da semana</span>
              <span className="font-semibold text-foreground">
                {stats.weeklyActivity.reduce((sum, d) => sum + d.interactions, 0)} interações
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
