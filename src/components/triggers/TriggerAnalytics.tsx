import { useState, useEffect, useMemo } from 'react';
import { Brain, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS, TriggerType } from '@/types/triggers';
import { logger } from '@/lib/logger';
import type {
  DISCProfile,
  TriggerUsageWithContact,
  DISCTriggerStats,
  TriggerEffectiveness,
  AnalyticsStats,
} from './TriggerAnalyticsTypes';
import { DISC_NAMES, RESULT_COLORS } from './TriggerAnalyticsTypes';
import { MetricCards } from './MetricCards';
import { OverviewTab } from './OverviewTab';
import { DISCProfileTab } from './DISCProfileTab';
import { TriggerRankingTab } from './TriggerRankingTab';

export function TriggerAnalytics({ className }: { className?: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<TriggerUsageWithContact[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | '365d' | 'all'>('90d');
  const [activeTab, setActiveTab] = useState<'overview' | 'disc' | 'triggers'>('overview');

  useEffect(() => {
    if (!user) return;

    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        let dateFilter = '';
        const now = new Date();
        if (periodFilter !== 'all') {
          const days = periodFilter === '30d' ? 30 : periodFilter === '90d' ? 90 : 365;
          const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          dateFilter = startDate.toISOString();
        }

        let query = supabase
          .from('trigger_usage_history')
          .select('id, trigger_type, result, effectiveness_rating, used_at, contact_id')
          .eq('user_id', user.id)
          .order('used_at', { ascending: false });

        if (dateFilter) {
          query = query.gte('used_at', dateFilter);
        }

        const { data: usageHistory, error: usageError } = await query;
        if (usageError) throw usageError;

        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, behavior')
          .eq('user_id', user.id);

        if (contactsError) throw contactsError;

        const contactDISCMap = new Map<string, DISCProfile | null>();
        contacts?.forEach((contact) => {
          const behavior = contact.behavior as { discProfile?: string } | null;
          const discProfile = behavior?.discProfile as DISCProfile | undefined;
          contactDISCMap.set(contact.id, discProfile || null);
        });

        const mergedData: TriggerUsageWithContact[] = (usageHistory || []).map((usage) => ({
          id: usage.id,
          trigger_type: usage.trigger_type,
          result: usage.result || 'pending',
          effectiveness_rating: usage.effectiveness_rating,
          used_at: usage.used_at,
          contact_disc: contactDISCMap.get(usage.contact_id) || null,
        }));

        setUsageData(mergedData);
      } catch (error) {
        logger.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user, periodFilter]);

  const stats: AnalyticsStats | null = useMemo(() => {
    if (usageData.length === 0) return null;

    const completedUsages = usageData.filter((u) => u.result !== 'pending');
    const successCount = usageData.filter((u) => u.result === 'success').length;
    const ratedUsages = usageData.filter((u) => u.effectiveness_rating !== null);
    const avgRating =
      ratedUsages.length > 0
        ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) /
          ratedUsages.length
        : 0;

    const byDISC: Record<DISCProfile, DISCTriggerStats> = {
      D: { discProfile: 'D', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      I: { discProfile: 'I', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      S: { discProfile: 'S', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      C: { discProfile: 'C', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
    };

    const discGroups: Record<DISCProfile, TriggerUsageWithContact[]> = {
      D: [],
      I: [],
      S: [],
      C: [],
    };
    usageData.forEach((u) => {
      if (u.contact_disc && discGroups[u.contact_disc]) {
        discGroups[u.contact_disc].push(u);
      }
    });

    Object.entries(discGroups).forEach(([disc, usages]) => {
      const d = disc as DISCProfile;
      const completed = usages.filter((u) => u.result !== 'pending');
      const success = usages.filter((u) => u.result === 'success').length;
      const rated = usages.filter((u) => u.effectiveness_rating !== null);

      byDISC[d].totalUsages = usages.length;
      byDISC[d].successRate = completed.length > 0 ? (success / completed.length) * 100 : 0;
      byDISC[d].avgRating =
        rated.length > 0
          ? (rated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / rated.length) * 20
          : 0;

      const triggerCounts: Record<
        string,
        { count: number; success: number; totalRating: number; ratedCount: number }
      > = {};
      usages.forEach((u) => {
        if (!triggerCounts[u.trigger_type]) {
          triggerCounts[u.trigger_type] = { count: 0, success: 0, totalRating: 0, ratedCount: 0 };
        }
        triggerCounts[u.trigger_type].count++;
        if (u.result === 'success') triggerCounts[u.trigger_type].success++;
        if (u.effectiveness_rating !== null) {
          triggerCounts[u.trigger_type].totalRating += u.effectiveness_rating;
          triggerCounts[u.trigger_type].ratedCount++;
        }
      });

      byDISC[d].topTriggers = Object.entries(triggerCounts)
        .map(([type, data]) => ({
          type: type as TriggerType,
          count: data.count,
          successRate: data.count > 0 ? (data.success / data.count) * 100 : 0,
          avgRating: data.ratedCount > 0 ? (data.totalRating / data.ratedCount) * 20 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    });

    const triggerStatsMap: Record<string, TriggerEffectiveness> = {};
    usageData.forEach((u) => {
      if (!triggerStatsMap[u.trigger_type]) {
        triggerStatsMap[u.trigger_type] = {
          triggerType: u.trigger_type as TriggerType,
          totalUsages: 0,
          successRate: 0,
          avgRating: 0,
          byDISC: {
            D: { usages: 0, successRate: 0, avgRating: 0 },
            I: { usages: 0, successRate: 0, avgRating: 0 },
            S: { usages: 0, successRate: 0, avgRating: 0 },
            C: { usages: 0, successRate: 0, avgRating: 0 },
          },
        };
      }
      triggerStatsMap[u.trigger_type].totalUsages++;
      if (u.contact_disc) {
        triggerStatsMap[u.trigger_type].byDISC[u.contact_disc].usages++;
      }
    });

    Object.values(triggerStatsMap).forEach((stat) => {
      const usages = usageData.filter((u) => u.trigger_type === stat.triggerType);
      const completed = usages.filter((u) => u.result !== 'pending');
      const success = usages.filter((u) => u.result === 'success').length;
      const rated = usages.filter((u) => u.effectiveness_rating !== null);

      stat.successRate = completed.length > 0 ? (success / completed.length) * 100 : 0;
      stat.avgRating =
        rated.length > 0
          ? (rated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / rated.length) * 20
          : 0;

      (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((disc) => {
        const discUsages = usages.filter((u) => u.contact_disc === disc);
        const discCompleted = discUsages.filter((u) => u.result !== 'pending');
        const discSuccess = discUsages.filter((u) => u.result === 'success').length;
        const discRated = discUsages.filter((u) => u.effectiveness_rating !== null);

        stat.byDISC[disc].successRate =
          discCompleted.length > 0 ? (discSuccess / discCompleted.length) * 100 : 0;
        stat.byDISC[disc].avgRating =
          discRated.length > 0
            ? (discRated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) /
                discRated.length) *
              20
            : 0;
      });
    });

    const resultDist = {
      success: usageData.filter((u) => u.result === 'success').length,
      neutral: usageData.filter((u) => u.result === 'neutral').length,
      failure: usageData.filter((u) => u.result === 'failure').length,
      pending: usageData.filter((u) => u.result === 'pending').length,
    };

    return {
      totalUsages: usageData.length,
      successRate: completedUsages.length > 0 ? (successCount / completedUsages.length) * 100 : 0,
      avgRating,
      byDISC,
      triggerStats: Object.values(triggerStatsMap).sort((a, b) => b.totalUsages - a.totalUsages),
      resultDist,
    };
  }, [usageData]);

  const discChartData = useMemo(() => {
    if (!stats) return [];
    return Object.values(stats.byDISC).map((d) => ({
      name: DISC_NAMES[d.discProfile],
      profile: d.discProfile,
      usages: d.totalUsages,
      successRate: d.successRate,
      rating: d.avgRating,
    }));
  }, [stats]);

  const resultPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Sucesso', value: stats.resultDist.success, color: RESULT_COLORS.success },
      { name: 'Neutro', value: stats.resultDist.neutral, color: RESULT_COLORS.neutral },
      { name: 'Falha', value: stats.resultDist.failure, color: RESULT_COLORS.failure },
      { name: 'Pendente', value: stats.resultDist.pending, color: RESULT_COLORS.pending },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const radarData = useMemo(() => {
    if (!stats) return [];
    return stats.triggerStats.slice(0, 6).map((t) => {
      const trigger = MENTAL_TRIGGERS[t.triggerType];
      return {
        trigger: trigger?.name || t.triggerType,
        D: t.byDISC.D.successRate,
        I: t.byDISC.I.successRate,
        S: t.byDISC.S.successRate,
        C: t.byDISC.C.successRate,
      };
    });
  }, [stats]);

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || usageData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sem dados de gatilhos ainda</h3>
          <p className="text-muted-foreground text-sm">
            Use gatilhos mentais nos seus contatos para ver as estatísticas aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Analytics de Gatilhos por DISC</h2>
        </div>
        <Select
          value={periodFilter}
          onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}
        >
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="365d">Último ano</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MetricCards stats={stats} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="disc">Por Perfil DISC</TabsTrigger>
          <TabsTrigger value="triggers">Por Gatilho</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewTab
            discChartData={discChartData}
            resultPieData={resultPieData}
            radarData={radarData}
          />
        </TabsContent>

        <TabsContent value="disc" className="space-y-6 mt-6">
          <DISCProfileTab byDISC={stats.byDISC} />
        </TabsContent>

        <TabsContent value="triggers" className="mt-6">
          <TriggerRankingTab triggerStats={stats.triggerStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
