import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from 'recharts';
import {
  Brain,
  Heart,
  Eye,
  Ear,
  Hand,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Activity,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type PeriodFilter = '7d' | '30d' | '90d' | '365d';

const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
];

const getPeriodDays = (period: PeriodFilter): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '365d': return 365;
  }
};

interface NLPStats {
  totalAnalyses: number;
  emotionalStates: {
    state: string;
    count: number;
    avgConfidence: number;
  }[];
  vakDistribution: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    digital: number;
  };
  discDistribution: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
  topValues: {
    name: string;
    count: number;
    avgImportance: number;
  }[];
  objectionTypes: {
    type: string;
    count: number;
    resolved: number;
  }[];
  emotionalTrend: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
}

const emotionColors: Record<string, string> = {
  'Entusiasmo': 'hsl(142, 76%, 36%)',
  'Confiança': 'hsl(199, 89%, 48%)',
  'Interesse': 'hsl(262, 83%, 58%)',
  'Hesitação': 'hsl(38, 92%, 50%)',
  'Frustração': 'hsl(0, 84%, 60%)',
  'Ceticismo': 'hsl(215, 16%, 47%)',
  'Satisfação': 'hsl(142, 71%, 45%)',
  'Ansiedade': 'hsl(25, 95%, 53%)',
};

const vakColors = {
  visual: 'hsl(199, 89%, 48%)',
  auditory: 'hsl(142, 76%, 36%)',
  kinesthetic: 'hsl(25, 95%, 53%)',
  digital: 'hsl(262, 83%, 58%)',
};

const discColors = {
  D: 'hsl(0, 84%, 60%)',
  I: 'hsl(38, 92%, 50%)',
  S: 'hsl(142, 76%, 36%)',
  C: 'hsl(199, 89%, 48%)',
};

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            <span style={{ color: entry.color }} className="font-medium">
              {entry.name}:
            </span>{' '}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function NLPAnalyticsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<NLPStats>({
    totalAnalyses: 0,
    emotionalStates: [],
    vakDistribution: { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 },
    discDistribution: { D: 0, I: 0, S: 0, C: 0 },
    topValues: [],
    objectionTypes: [],
    emotionalTrend: [],
  });

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
      console.error('Error fetching NLP stats:', error);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
                  <p className="text-sm text-muted-foreground">Análises PNL</p>
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
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-pink-500/10">
                  <Heart className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.emotionalStates.length}</p>
                  <p className="text-sm text-muted-foreground">Estados Emocionais</p>
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
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.topValues.length}</p>
                  <p className="text-sm text-muted-foreground">Valores Únicos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.objectionTypes.reduce((a, b) => a + b.count, 0)}</p>
                  <p className="text-sm text-muted-foreground">Objeções Detectadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="emotions">Emoções</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="values">Valores</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emotional Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Tendência Emocional (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.emotionalTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="positive" 
                        name="Positivo" 
                        stackId="1"
                        stroke="hsl(142, 76%, 36%)" 
                        fill="hsl(142, 76%, 36%)" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="neutral" 
                        name="Neutro" 
                        stackId="1"
                        stroke="hsl(215, 16%, 47%)" 
                        fill="hsl(215, 16%, 47%)" 
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="negative" 
                        name="Negativo" 
                        stackId="1"
                        stroke="hsl(0, 84%, 60%)" 
                        fill="hsl(0, 84%, 60%)" 
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* VAK Radar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Distribuição VAK
                </CardTitle>
                <CardDescription>Perfis sensoriais agregados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-border/50" />
                      <PolarAngleAxis dataKey="subject" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="VAK Score"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* DISC Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Distribuição DISC
                </CardTitle>
                <CardDescription>Perfis comportamentais dos contatos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={discChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                      >
                        {discChartData.map((entry) => (
                          <Cell 
                            key={entry.profile} 
                            fill={discColors[entry.profile as keyof typeof discColors]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Values */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Principais Valores Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topValues.length > 0 ? (
                    stats.topValues.slice(0, 6).map((value, index) => (
                      <div key={value.name} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-6 text-muted-foreground">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{value.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {value.count} ocorrências
                            </span>
                          </div>
                          <Progress value={value.avgImportance * 10} className="h-2" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum valor detectado ainda
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emotions Tab */}
        <TabsContent value="emotions" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estados Emocionais por Frequência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.emotionalStates} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis type="number" />
                      <YAxis dataKey="state" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Ocorrências" radius={[0, 4, 4, 0]}>
                        {stats.emotionalStates.map((entry) => (
                          <Cell 
                            key={entry.state} 
                            fill={emotionColors[entry.state] || 'hsl(var(--primary))'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes dos Estados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.emotionalStates.length > 0 ? (
                    stats.emotionalStates.map((emotion) => (
                      <div key={emotion.state} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: emotionColors[emotion.state] || 'hsl(var(--primary))' }}
                          />
                          <span className="font-medium">{emotion.state}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {emotion.count} vezes
                          </span>
                          <Badge variant="outline">
                            {emotion.avgConfidence}% confiança
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhum estado emocional registrado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VAK Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Análise VAK Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {vakChartData.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm font-bold">{item.value}%</span>
                        </div>
                        <Progress 
                          value={item.value} 
                          className="h-3"
                          style={{ 
                            '--progress-background': vakColors[item.name.toLowerCase() === 'cinestésico' ? 'kinesthetic' : item.name.toLowerCase() === 'auditivo' ? 'auditory' : item.name.toLowerCase() as keyof typeof vakColors]
                          } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* DISC Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Análise DISC Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {discChartData.map((item) => (
                    <div key={item.profile} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge 
                            style={{ 
                              backgroundColor: discColors[item.profile as keyof typeof discColors],
                              color: 'white'
                            }}
                          >
                            {item.profile}
                          </Badge>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.value} contatos</span>
                      </div>
                      <Progress 
                        value={(item.value / Math.max(...discChartData.map(d => d.value), 1)) * 100} 
                        className="h-3"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Values Tab */}
        <TabsContent value="values" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Values Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Valores dos Clientes</CardTitle>
                <CardDescription>Valores mais frequentes detectados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topValues}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Ocorrências" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Objections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Objeções por Tipo
                </CardTitle>
                <CardDescription>Taxa de resolução por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.objectionTypes.length > 0 ? (
                    stats.objectionTypes.map((objection) => (
                      <div key={objection.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{objection.type}</span>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{objection.count} total</span>
                            <Badge variant={objection.resolved > objection.count / 2 ? 'default' : 'secondary'}>
                              {objection.resolved} resolvidas
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(objection.resolved / objection.count) * 100} 
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {Math.round((objection.resolved / objection.count) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma objeção registrada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
