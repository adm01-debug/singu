import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Target,
  Award,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { MENTAL_TRIGGERS, TriggerType, TRIGGER_CATEGORIES, TriggerCategory } from '@/types/triggers';
import { TriggerResult } from '@/hooks/useTriggerHistory';
import { logger } from "@/lib/logger";

type DISCProfile = 'D' | 'I' | 'S' | 'C';

interface TriggerUsageWithContact {
  id: string;
  trigger_type: string;
  result: string;
  effectiveness_rating: number | null;
  used_at: string;
  contact_disc: DISCProfile | null;
}

interface DISCTriggerStats {
  discProfile: DISCProfile;
  totalUsages: number;
  successRate: number;
  avgRating: number;
  topTriggers: Array<{
    type: TriggerType;
    count: number;
    successRate: number;
    avgRating: number;
  }>;
}

interface TriggerEffectiveness {
  triggerType: TriggerType;
  totalUsages: number;
  successRate: number;
  avgRating: number;
  byDISC: Record<DISCProfile, { usages: number; successRate: number; avgRating: number }>;
}

const DISC_COLORS: Record<DISCProfile, string> = {
  D: 'hsl(0, 84%, 60%)',
  I: 'hsl(45, 93%, 47%)',
  S: 'hsl(142, 76%, 36%)',
  C: 'hsl(221, 83%, 53%)',
};

const DISC_BG_COLORS: Record<DISCProfile, string> = {
  D: 'bg-red-500/10 text-red-600',
  I: 'bg-amber-500/10 text-amber-600',
  S: 'bg-emerald-500/10 text-emerald-600',
  C: 'bg-blue-500/10 text-blue-600',
};

const DISC_NAMES: Record<DISCProfile, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Conforme',
};

const RESULT_COLORS: Record<TriggerResult, string> = {
  success: 'hsl(142, 76%, 36%)',
  neutral: 'hsl(215, 16%, 47%)',
  failure: 'hsl(0, 84%, 60%)',
  pending: 'hsl(45, 93%, 47%)',
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>{' '}
            {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            {entry.dataKey?.includes('Rate') || entry.dataKey?.includes('rating') ? '%' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function TriggerAnalytics({ className }: { className?: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<TriggerUsageWithContact[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'30d' | '90d' | '365d' | 'all'>('90d');
  const [activeTab, setActiveTab] = useState<'overview' | 'disc' | 'triggers'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, periodFilter]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Calculate date filter
      let dateFilter = '';
      const now = new Date();
      if (periodFilter !== 'all') {
        const days = periodFilter === '30d' ? 30 : periodFilter === '90d' ? 90 : 365;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        dateFilter = startDate.toISOString();
      }

      // Fetch trigger usage history with contact DISC profile
      let query = supabase
        .from('trigger_usage_history')
        .select(`
          id,
          trigger_type,
          result,
          effectiveness_rating,
          used_at,
          contact_id
        `)
        .eq('user_id', user.id)
        .order('used_at', { ascending: false });

      if (dateFilter) {
        query = query.gte('used_at', dateFilter);
      }

      const { data: usageHistory, error: usageError } = await query;

      if (usageError) throw usageError;

      // Fetch contacts to get DISC profiles
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, behavior')
        .eq('user_id', user.id);

      if (contactsError) throw contactsError;

      // Create a map of contact id to DISC profile
      const contactDISCMap = new Map<string, DISCProfile | null>();
      contacts?.forEach((contact) => {
        const behavior = contact.behavior as { discProfile?: string } | null;
        const discProfile = behavior?.discProfile as DISCProfile | undefined;
        contactDISCMap.set(contact.id, discProfile || null);
      });

      // Merge data
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

  // Calculate statistics
  const stats = useMemo(() => {
    if (usageData.length === 0) return null;

    // Overall stats
    const completedUsages = usageData.filter(u => u.result !== 'pending');
    const successCount = usageData.filter(u => u.result === 'success').length;
    const ratedUsages = usageData.filter(u => u.effectiveness_rating !== null);
    const avgRating = ratedUsages.length > 0
      ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / ratedUsages.length
      : 0;

    // By DISC profile
    const byDISC: Record<DISCProfile, DISCTriggerStats> = {
      D: { discProfile: 'D', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      I: { discProfile: 'I', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      S: { discProfile: 'S', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
      C: { discProfile: 'C', totalUsages: 0, successRate: 0, avgRating: 0, topTriggers: [] },
    };

    // Group by DISC
    const discGroups: Record<DISCProfile, TriggerUsageWithContact[]> = {
      D: [], I: [], S: [], C: [],
    };

    usageData.forEach((u) => {
      if (u.contact_disc && discGroups[u.contact_disc]) {
        discGroups[u.contact_disc].push(u);
      }
    });

    // Calculate stats for each DISC
    Object.entries(discGroups).forEach(([disc, usages]) => {
      const d = disc as DISCProfile;
      const completed = usages.filter(u => u.result !== 'pending');
      const success = usages.filter(u => u.result === 'success').length;
      const rated = usages.filter(u => u.effectiveness_rating !== null);

      byDISC[d].totalUsages = usages.length;
      byDISC[d].successRate = completed.length > 0 ? (success / completed.length) * 100 : 0;
      byDISC[d].avgRating = rated.length > 0
        ? (rated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / rated.length) * 20 // Convert to percentage
        : 0;

      // Top triggers for this DISC
      const triggerCounts: Record<string, { count: number; success: number; totalRating: number; ratedCount: number }> = {};
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

    // By Trigger type
    const triggerStats: Record<string, TriggerEffectiveness> = {};
    usageData.forEach((u) => {
      if (!triggerStats[u.trigger_type]) {
        triggerStats[u.trigger_type] = {
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
      triggerStats[u.trigger_type].totalUsages++;
      if (u.contact_disc) {
        triggerStats[u.trigger_type].byDISC[u.contact_disc].usages++;
      }
    });

    // Calculate rates for triggers
    Object.values(triggerStats).forEach((stat) => {
      const usages = usageData.filter(u => u.trigger_type === stat.triggerType);
      const completed = usages.filter(u => u.result !== 'pending');
      const success = usages.filter(u => u.result === 'success').length;
      const rated = usages.filter(u => u.effectiveness_rating !== null);

      stat.successRate = completed.length > 0 ? (success / completed.length) * 100 : 0;
      stat.avgRating = rated.length > 0
        ? (rated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / rated.length) * 20
        : 0;

      // Calculate by DISC
      (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((disc) => {
        const discUsages = usages.filter(u => u.contact_disc === disc);
        const discCompleted = discUsages.filter(u => u.result !== 'pending');
        const discSuccess = discUsages.filter(u => u.result === 'success').length;
        const discRated = discUsages.filter(u => u.effectiveness_rating !== null);

        stat.byDISC[disc].successRate = discCompleted.length > 0 ? (discSuccess / discCompleted.length) * 100 : 0;
        stat.byDISC[disc].avgRating = discRated.length > 0
          ? (discRated.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / discRated.length) * 20
          : 0;
      });
    });

    // Result distribution
    const resultDist = {
      success: usageData.filter(u => u.result === 'success').length,
      neutral: usageData.filter(u => u.result === 'neutral').length,
      failure: usageData.filter(u => u.result === 'failure').length,
      pending: usageData.filter(u => u.result === 'pending').length,
    };

    return {
      totalUsages: usageData.length,
      successRate: completedUsages.length > 0 ? (successCount / completedUsages.length) * 100 : 0,
      avgRating,
      byDISC,
      triggerStats: Object.values(triggerStats).sort((a, b) => b.totalUsages - a.totalUsages),
      resultDist,
    };
  }, [usageData]);

  // Chart data
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
    ].filter(d => d.value > 0);
  }, [stats]);

  const radarData = useMemo(() => {
    if (!stats) return [];
    // Get top 6 triggers
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
      {/* Header with filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Analytics de Gatilhos por DISC</h2>
        </div>
        <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as typeof periodFilter)}>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsages}</p>
                  <p className="text-xs text-muted-foreground">Total de usos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Nota média (1-5)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Object.values(stats.byDISC).filter(d => d.totalUsages > 0).length}</p>
                  <p className="text-xs text-muted-foreground">Perfis DISC ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="disc">Por Perfil DISC</TabsTrigger>
          <TabsTrigger value="triggers">Por Gatilho</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DISC Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Performance por Perfil DISC
                </CardTitle>
                <CardDescription>Taxa de sucesso e nota média por perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="successRate" name="Taxa Sucesso %" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="rating" name="Nota Média %" fill="hsl(45, 93%, 47%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Result Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Distribuição de Resultados
                </CardTitle>
                <CardDescription>Resultados dos gatilhos utilizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resultPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {resultPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Radar Chart - Trigger effectiveness by DISC */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Efetividade dos Gatilhos por DISC
                </CardTitle>
                <CardDescription>Taxa de sucesso dos principais gatilhos em cada perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="trigger" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar name="Dominante (D)" dataKey="D" stroke={DISC_COLORS.D} fill={DISC_COLORS.D} fillOpacity={0.2} />
                      <Radar name="Influente (I)" dataKey="I" stroke={DISC_COLORS.I} fill={DISC_COLORS.I} fillOpacity={0.2} />
                      <Radar name="Estável (S)" dataKey="S" stroke={DISC_COLORS.S} fill={DISC_COLORS.S} fillOpacity={0.2} />
                      <Radar name="Conforme (C)" dataKey="C" stroke={DISC_COLORS.C} fill={DISC_COLORS.C} fillOpacity={0.2} />
                      <Legend />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* DISC Tab */}
        <TabsContent value="disc" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(stats.byDISC).map((discStats) => (
              <Card key={discStats.discProfile}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={cn('text-base px-3 py-1', DISC_BG_COLORS[discStats.discProfile])}>
                      {discStats.discProfile}
                    </Badge>
                    <span className="text-base">{DISC_NAMES[discStats.discProfile]}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{discStats.totalUsages}</p>
                      <p className="text-xs text-muted-foreground">Usos</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{discStats.successRate.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">Sucesso</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">{(discStats.avgRating / 20).toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Nota</p>
                    </div>
                  </div>

                  {/* Top triggers */}
                  {discStats.topTriggers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Gatilhos mais usados:</p>
                      <div className="space-y-2">
                        {discStats.topTriggers.map((t) => {
                          const trigger = MENTAL_TRIGGERS[t.type];
                          return (
                            <div key={t.type} className="flex items-center gap-2">
                              <span className="text-lg">{trigger?.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{trigger?.name || t.type}</p>
                                <Progress value={t.successRate} className="h-1.5" />
                              </div>
                              <div className="text-right text-xs">
                                <p className="text-muted-foreground">{t.count}x</p>
                                <p className="text-emerald-600">{t.successRate.toFixed(0)}%</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {discStats.topTriggers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum gatilho usado com este perfil ainda.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4" />
                Ranking de Gatilhos por Efetividade
              </CardTitle>
              <CardDescription>Gatilhos ordenados por taxa de sucesso e nota média</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {stats.triggerStats.map((triggerStat, index) => {
                    const trigger = MENTAL_TRIGGERS[triggerStat.triggerType];
                    const categoryInfo = trigger ? TRIGGER_CATEGORIES[trigger.category] : null;
                    
                    return (
                      <motion.div
                        key={triggerStat.triggerType}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>

                        {/* Trigger info */}
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-lg', trigger?.color)}>
                          {trigger?.icon || '🎯'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold">{trigger?.name || triggerStat.triggerType}</h4>
                            {categoryInfo && (
                              <Badge variant="outline" className="text-xs">
                                {categoryInfo.icon} {categoryInfo.name}
                              </Badge>
                            )}
                          </div>
                          
                          {/* DISC breakdown */}
                          <div className="flex items-center gap-2 mt-2">
                            {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((disc) => {
                              const discData = triggerStat.byDISC[disc];
                              if (discData.usages === 0) return null;
                              return (
                                <Badge
                                  key={disc}
                                  variant="secondary"
                                  className={cn('text-xs', DISC_BG_COLORS[disc])}
                                >
                                  {disc}: {discData.successRate.toFixed(0)}%
                                </Badge>
                              );
                            })}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right space-y-1">
                          <p className="text-sm">
                            <span className="text-muted-foreground">Usos:</span>{' '}
                            <span className="font-semibold">{triggerStat.totalUsages}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Sucesso:</span>{' '}
                            <span className="font-semibold text-emerald-600">{triggerStat.successRate.toFixed(0)}%</span>
                          </p>
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold">{(triggerStat.avgRating / 20).toFixed(1)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
