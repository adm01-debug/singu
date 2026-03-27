import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  Ear,
  Hand,
  Lightbulb,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { NLPStats, PeriodFilter } from './NLPAnalyticsTypes';
import { periodOptions, getPeriodDays, emptyNLPStats } from './NLPAnalyticsTypes';
import { NLPSummaryStats } from './NLPSummaryStats';
import { NLPOverviewTab } from './NLPOverviewTab';
import { NLPEmotionsTab } from './NLPEmotionsTab';
import { NLPProfilesTab } from './NLPProfilesTab';
import { NLPValuesTab } from './NLPValuesTab';

export function NLPAnalyticsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<NLPStats>(emptyNLPStats);

  useEffect(() => {
    if (user) {
      fetchNLPStats();
    }
  }, [user, period]);

  const getDateFilter = () => {
    const days = getPeriodDays(period);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const fetchNLPStats = async () => {
    if (!user) return;
    setLoading(true);

    const dateFilter = getDateFilter();

    try {
      // Fetch emotional states with date filter
      const { data: emotionalData } = await supabase
        .from('emotional_states_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter);

      // Fetch VAK analysis with date filter
      const { data: vakData } = await supabase
        .from('vak_analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter);

      // Fetch contacts for DISC profiles (no date filter - always all)
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('behavior')
        .eq('user_id', user.id);

      // Fetch client values with date filter
      const { data: valuesData } = await supabase
        .from('client_values')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter);

      // Fetch hidden objections with date filter
      const { data: objectionsData } = await supabase
        .from('hidden_objections')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateFilter);

      // Process emotional states
      const emotionalMap = new Map<string, { count: number; totalConfidence: number }>();
      emotionalData?.forEach((e) => {
        const current = emotionalMap.get(e.emotional_state) || { count: 0, totalConfidence: 0 };
        emotionalMap.set(e.emotional_state, {
          count: current.count + 1,
          totalConfidence: current.totalConfidence + (e.confidence || 0),
        });
      });
      const emotionalStates = Array.from(emotionalMap.entries())
        .map(([state, data]) => ({
          state,
          count: data.count,
          avgConfidence: Math.round(data.totalConfidence / data.count),
        }))
        .sort((a, b) => b.count - a.count);

      // Process VAK distribution
      let vakTotals = { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 };
      vakData?.forEach((v) => {
        vakTotals.visual += v.visual_score || 0;
        vakTotals.auditory += v.auditory_score || 0;
        vakTotals.kinesthetic += v.kinesthetic_score || 0;
        vakTotals.digital += v.digital_score || 0;
      });
      const vakCount = vakData?.length || 1;
      const vakDistribution = {
        visual: Math.round(vakTotals.visual / vakCount),
        auditory: Math.round(vakTotals.auditory / vakCount),
        kinesthetic: Math.round(vakTotals.kinesthetic / vakCount),
        digital: Math.round(vakTotals.digital / vakCount),
      };

      // Process DISC distribution
      const discCount = { D: 0, I: 0, S: 0, C: 0 };
      contactsData?.forEach((c) => {
        const behavior = c.behavior as { disc_profile?: string } | null;
        const disc = behavior?.disc_profile?.toUpperCase();
        if (disc && disc in discCount) {
          discCount[disc as keyof typeof discCount]++;
        }
      });

      // Process values
      const valuesMap = new Map<string, { count: number; totalImportance: number }>();
      valuesData?.forEach((v) => {
        const current = valuesMap.get(v.value_name) || { count: 0, totalImportance: 0 };
        valuesMap.set(v.value_name, {
          count: current.count + 1,
          totalImportance: current.totalImportance + (v.importance || 0),
        });
      });
      const topValues = Array.from(valuesMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          avgImportance: Math.round(data.totalImportance / data.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Process objections
      const objectionMap = new Map<string, { count: number; resolved: number }>();
      objectionsData?.forEach((o) => {
        const current = objectionMap.get(o.objection_type) || { count: 0, resolved: 0 };
        objectionMap.set(o.objection_type, {
          count: current.count + 1,
          resolved: current.resolved + (o.resolved ? 1 : 0),
        });
      });
      const objectionTypes = Array.from(objectionMap.entries())
        .map(([type, data]) => ({
          type,
          count: data.count,
          resolved: data.resolved,
        }))
        .sort((a, b) => b.count - a.count);

      // Process emotional trend based on period
      const days = getPeriodDays(period);
      const now = new Date();

      let trendData: { date: string; positive: number; neutral: number; negative: number }[] = [];

      if (days <= 7) {
        // Daily for 7 days
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - i));
          return date.toISOString().split('T')[0];
        });

        trendData = dates.map((date) => {
          const dayEmotions = emotionalData?.filter((e) =>
            e.created_at.startsWith(date)
          ) || [];

          const positive = dayEmotions.filter((e) =>
            ['Entusiasmo', 'Confiança', 'Interesse', 'Satisfação'].includes(e.emotional_state)
          ).length;
          const negative = dayEmotions.filter((e) =>
            ['Frustração', 'Ansiedade'].includes(e.emotional_state)
          ).length;
          const neutral = dayEmotions.length - positive - negative;

          return {
            date: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
            positive,
            neutral: neutral >= 0 ? neutral : 0,
            negative,
          };
        });
      } else if (days <= 30) {
        // Weekly for 30 days
        for (let week = 3; week >= 0; week--) {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - (week * 7 + 6));
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() - (week * 7));

          const weekEmotions = emotionalData?.filter((e) => {
            const date = new Date(e.created_at);
            return date >= weekStart && date <= weekEnd;
          }) || [];

          const positive = weekEmotions.filter((e) =>
            ['Entusiasmo', 'Confiança', 'Interesse', 'Satisfação'].includes(e.emotional_state)
          ).length;
          const negative = weekEmotions.filter((e) =>
            ['Frustração', 'Ansiedade'].includes(e.emotional_state)
          ).length;
          const neutral = weekEmotions.length - positive - negative;

          trendData.push({
            date: `Sem ${4 - week}`,
            positive,
            neutral: neutral >= 0 ? neutral : 0,
            negative,
          });
        }
      } else {
        // Monthly for 90+ days
        const months = days <= 90 ? 3 : 12;
        for (let month = months - 1; month >= 0; month--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - month, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - month + 1, 0);

          const monthEmotions = emotionalData?.filter((e) => {
            const date = new Date(e.created_at);
            return date >= monthStart && date <= monthEnd;
          }) || [];

          const positive = monthEmotions.filter((e) =>
            ['Entusiasmo', 'Confiança', 'Interesse', 'Satisfação'].includes(e.emotional_state)
          ).length;
          const negative = monthEmotions.filter((e) =>
            ['Frustração', 'Ansiedade'].includes(e.emotional_state)
          ).length;
          const neutral = monthEmotions.length - positive - negative;

          trendData.push({
            date: monthStart.toLocaleDateString('pt-BR', { month: 'short' }),
            positive,
            neutral: neutral >= 0 ? neutral : 0,
            negative,
          });
        }
      }

      const emotionalTrend = trendData;

      const totalAnalyses = (emotionalData?.length || 0) + (vakData?.length || 0) +
                           (valuesData?.length || 0) + (objectionsData?.length || 0);

      setStats({
        totalAnalyses,
        emotionalStates,
        vakDistribution,
        discDistribution: discCount,
        topValues,
        objectionTypes,
        emotionalTrend,
      });
    } catch (error) {
      logger.error('Error fetching NLP stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const vakChartData = useMemo(() => [
    { name: 'Visual', value: stats.vakDistribution.visual, icon: Eye },
    { name: 'Auditivo', value: stats.vakDistribution.auditory, icon: Ear },
    { name: 'Cinestésico', value: stats.vakDistribution.kinesthetic, icon: Hand },
    { name: 'Digital', value: stats.vakDistribution.digital, icon: Lightbulb },
  ], [stats.vakDistribution]);

  const discChartData = useMemo(() => [
    { name: 'Dominância', value: stats.discDistribution.D, profile: 'D' },
    { name: 'Influência', value: stats.discDistribution.I, profile: 'I' },
    { name: 'Estabilidade', value: stats.discDistribution.S, profile: 'S' },
    { name: 'Conformidade', value: stats.discDistribution.C, profile: 'C' },
  ], [stats.discDistribution]);

  const radarData = useMemo(() => {
    const maxVak = Math.max(...Object.values(stats.vakDistribution), 1);
    return [
      { subject: 'Visual', value: Math.round((stats.vakDistribution.visual / maxVak) * 100) },
      { subject: 'Auditivo', value: Math.round((stats.vakDistribution.auditory / maxVak) * 100) },
      { subject: 'Cinestésico', value: Math.round((stats.vakDistribution.kinesthetic / maxVak) * 100) },
      { subject: 'Digital', value: Math.round((stats.vakDistribution.digital / maxVak) * 100) },
    ];
  }, [stats.vakDistribution]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => fetchNLPStats()}>
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <NLPSummaryStats stats={stats} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emotions">Emoções</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <NLPOverviewTab stats={stats} radarData={radarData} discChartData={discChartData} />
        </TabsContent>

        <TabsContent value="emotions" className="space-y-6 mt-6">
          <NLPEmotionsTab stats={stats} />
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6 mt-6">
          <NLPProfilesTab vakChartData={vakChartData} discChartData={discChartData} />
        </TabsContent>

        <TabsContent value="values" className="space-y-6 mt-6">
          <NLPValuesTab stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
