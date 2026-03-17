import React, { useState, useEffect, forwardRef } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
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
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Activity,
  Users,
  MessageSquare,
  Heart,
  Target,
  Zap,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TriggerAnalytics } from '@/components/triggers/TriggerAnalytics';
import { AdvancedTriggersPanel } from '@/components/triggers/AdvancedTriggersPanel';
import { ChurnPredictionPanel } from '@/components/analytics/ChurnPredictionPanel';
import { BestTimeToContactPanel } from '@/components/analytics/BestTimeToContactPanel';
import { DealVelocityPanel } from '@/components/analytics/DealVelocityPanel';
import { NLPAnalyticsPanel } from '@/components/analytics/NLPAnalyticsPanel';
import { ClosingScoreRanking } from '@/components/analytics/ClosingScoreRanking';
import { AccountChurnPredictionPanel } from '@/components/analytics/AccountChurnPredictionPanel';
import { RFMAnalysisPanel } from '@/components/analytics/RFMAnalysisPanel';
import DISCAnalyticsPanel from '@/components/analytics/DISCAnalyticsPanel';
import NeuroPortfolioDashboard from '@/components/analytics/NeuroPortfolioDashboard';
import { 
  DISCTrainingMode, 
  DISCConversionMetrics
} from '@/components/disc';
import {
  NLPTrainingMode,
  NLPConversionMetrics,
  // Advanced NLP Components
  RapportRealtimeCoach,
  IncongruenceDetector,
  MiltonianCalibration,
  PerceptualPositions,
  TOTEModelMapper,
  HierarchyOfCriteria,
  WellFormedOutcomeBuilder,
  ChunkingNavigator,
  AnchorTrackingSystem,
  StateElicitationToolkit,
  SubmodalityModifier,
  SwishPatternGenerator
} from '@/components/nlp';
import {
  NeuroEnrichedTriggers,
  NeuroRadarChart,
  NeuroTimeline,
  NeuroABTracker,
  NeuroHeatmapCalendar,
  NeuroTrainingMode,
  NeurochemicalInfluenceMap
} from '@/components/neuromarketing';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { cn } from '@/lib/utils';

type PeriodFilter = '7d' | '30d' | '90d' | '365d';

interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

const calcChange = (current: number, previous: number): PeriodComparison => {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change,
    changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
};

const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
];

// Mock data generators
const getRelationshipEvolutionData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { date: 'Seg', score: 71, newContacts: 2, interactions: 8 },
      { date: 'Ter', score: 72, newContacts: 1, interactions: 12 },
      { date: 'Qua', score: 73, newContacts: 3, interactions: 15 },
      { date: 'Qui', score: 72, newContacts: 0, interactions: 10 },
      { date: 'Sex', score: 74, newContacts: 2, interactions: 18 },
      { date: 'Sab', score: 74, newContacts: 0, interactions: 3 },
      { date: 'Dom', score: 75, newContacts: 0, interactions: 2 },
    ],
    '30d': [
      { date: 'Sem 1', score: 68, newContacts: 5, interactions: 42 },
      { date: 'Sem 2', score: 70, newContacts: 8, interactions: 55 },
      { date: 'Sem 3', score: 72, newContacts: 6, interactions: 48 },
      { date: 'Sem 4', score: 75, newContacts: 7, interactions: 62 },
    ],
    '90d': [
      { date: 'Out', score: 65, newContacts: 18, interactions: 145 },
      { date: 'Nov', score: 70, newContacts: 22, interactions: 178 },
      { date: 'Dez', score: 75, newContacts: 15, interactions: 162 },
    ],
    '365d': [
      { date: 'Jan', score: 55, newContacts: 12, interactions: 98 },
      { date: 'Fev', score: 58, newContacts: 15, interactions: 110 },
      { date: 'Mar', score: 60, newContacts: 18, interactions: 125 },
      { date: 'Abr', score: 62, newContacts: 14, interactions: 118 },
      { date: 'Mai', score: 65, newContacts: 20, interactions: 142 },
      { date: 'Jun', score: 67, newContacts: 22, interactions: 155 },
      { date: 'Jul', score: 68, newContacts: 16, interactions: 138 },
      { date: 'Ago', score: 70, newContacts: 19, interactions: 148 },
      { date: 'Set', score: 72, newContacts: 21, interactions: 165 },
      { date: 'Out', score: 73, newContacts: 18, interactions: 152 },
      { date: 'Nov', score: 74, newContacts: 23, interactions: 178 },
      { date: 'Dez', score: 75, newContacts: 15, interactions: 162 },
    ],
  };
  return dataByPeriod[period];
};

const getSentimentDistributionData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { name: 'Positivo', value: 45, prevValue: 42 },
      { name: 'Neutro', value: 35, prevValue: 38 },
      { name: 'Negativo', value: 8, prevValue: 10 },
    ],
    '30d': [
      { name: 'Positivo', value: 52, prevValue: 45 },
      { name: 'Neutro', value: 42, prevValue: 45 },
      { name: 'Negativo', value: 12, prevValue: 16 },
    ],
    '90d': [
      { name: 'Positivo', value: 68, prevValue: 55 },
      { name: 'Neutro', value: 55, prevValue: 60 },
      { name: 'Negativo', value: 18, prevValue: 25 },
    ],
    '365d': [
      { name: 'Positivo', value: 285, prevValue: 240 },
      { name: 'Neutro', value: 220, prevValue: 250 },
      { name: 'Negativo', value: 65, prevValue: 85 },
    ],
  };
  return dataByPeriod[period];
};

const getSentimentColors = () => ({
  Positivo: 'hsl(142, 76%, 36%)',
  Neutro: 'hsl(215, 16%, 47%)',
  Negativo: 'hsl(0, 84%, 60%)',
});

const getEngagementByChannelData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { channel: 'Email', sent: 17, received: 12, rate: 71 },
      { channel: 'Reunião', sent: 8, received: 8, rate: 100 },
      { channel: 'Ligação', sent: 10, received: 6, rate: 60 },
      { channel: 'WhatsApp', sent: 25, received: 22, rate: 88 },
    ],
    '30d': [
      { channel: 'Email', sent: 65, received: 48, rate: 74 },
      { channel: 'Reunião', sent: 28, received: 28, rate: 100 },
      { channel: 'Ligação', sent: 42, received: 28, rate: 67 },
      { channel: 'WhatsApp', sent: 95, received: 82, rate: 86 },
    ],
    '90d': [
      { channel: 'Email', sent: 185, received: 142, rate: 77 },
      { channel: 'Reunião', sent: 75, received: 75, rate: 100 },
      { channel: 'Ligação', sent: 118, received: 82, rate: 69 },
      { channel: 'WhatsApp', sent: 265, received: 235, rate: 89 },
    ],
    '365d': [
      { channel: 'Email', sent: 720, received: 548, rate: 76 },
      { channel: 'Reunião', sent: 285, received: 285, rate: 100 },
      { channel: 'Ligação', sent: 465, received: 325, rate: 70 },
      { channel: 'WhatsApp', sent: 1050, received: 920, rate: 88 },
    ],
  };
  return dataByPeriod[period];
};

const getEngagementRadarData = (period: PeriodFilter) => {
  const dataByPeriod = {
    '7d': [
      { metric: 'Frequência', value: 75, fullMark: 100 },
      { metric: 'Resposta', value: 82, fullMark: 100 },
      { metric: 'Qualidade', value: 68, fullMark: 100 },
      { metric: 'Proatividade', value: 55, fullMark: 100 },
      { metric: 'Follow-up', value: 72, fullMark: 100 },
      { metric: 'Conversão', value: 45, fullMark: 100 },
    ],
    '30d': [
      { metric: 'Frequência', value: 78, fullMark: 100 },
      { metric: 'Resposta', value: 85, fullMark: 100 },
      { metric: 'Qualidade', value: 72, fullMark: 100 },
      { metric: 'Proatividade', value: 62, fullMark: 100 },
      { metric: 'Follow-up', value: 78, fullMark: 100 },
      { metric: 'Conversão', value: 52, fullMark: 100 },
    ],
    '90d': [
      { metric: 'Frequência', value: 82, fullMark: 100 },
      { metric: 'Resposta', value: 88, fullMark: 100 },
      { metric: 'Qualidade', value: 76, fullMark: 100 },
      { metric: 'Proatividade', value: 68, fullMark: 100 },
      { metric: 'Follow-up', value: 82, fullMark: 100 },
      { metric: 'Conversão', value: 58, fullMark: 100 },
    ],
    '365d': [
      { metric: 'Frequência', value: 85, fullMark: 100 },
      { metric: 'Resposta', value: 90, fullMark: 100 },
      { metric: 'Qualidade', value: 80, fullMark: 100 },
      { metric: 'Proatividade', value: 72, fullMark: 100 },
      { metric: 'Follow-up', value: 85, fullMark: 100 },
      { metric: 'Conversão', value: 65, fullMark: 100 },
    ],
  };
  return dataByPeriod[period];
};

const getTopPerformersData = () => [
  { name: 'João Silva', score: 92, interactions: 45, sentiment: 'positivo' },
  { name: 'Maria Santos', score: 88, interactions: 38, sentiment: 'positivo' },
  { name: 'Pedro Costa', score: 85, interactions: 32, sentiment: 'neutro' },
  { name: 'Ana Oliveira', score: 82, interactions: 28, sentiment: 'positivo' },
  { name: 'Carlos Lima', score: 78, interactions: 25, sentiment: 'neutro' },
];

const getMetricsStats = (period: PeriodFilter) => {
  const statsByPeriod = {
    '7d': {
      totalInteractions: calcChange(68, 55),
      avgScore: calcChange(75, 71),
      positiveRate: calcChange(54, 48),
      engagementRate: calcChange(78, 72),
    },
    '30d': {
      totalInteractions: calcChange(207, 175),
      avgScore: calcChange(75, 68),
      positiveRate: calcChange(49, 42),
      engagementRate: calcChange(82, 75),
    },
    '90d': {
      totalInteractions: calcChange(485, 420),
      avgScore: calcChange(75, 65),
      positiveRate: calcChange(48, 40),
      engagementRate: calcChange(85, 78),
    },
    '365d': {
      totalInteractions: calcChange(1570, 1320),
      avgScore: calcChange(75, 55),
      positiveRate: calcChange(50, 42),
      engagementRate: calcChange(88, 80),
    },
  };
  return statsByPeriod[period];
};

// Tooltip payload types for Recharts
interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

// Custom Tooltip - Using forwardRef to support Recharts ref forwarding
const CustomTooltip = forwardRef<HTMLDivElement, CustomTooltipProps>(
  function CustomTooltip({ active, payload, label }, ref) {
    if (active && payload && payload.length) {
      return (
        <div ref={ref} className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry, index: number) => (
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
  }
);

const PieTooltip = forwardRef<HTMLDivElement, CustomTooltipProps>(
  function PieTooltip({ active, payload }, ref) {
    if (active && payload && payload.length) {
      return (
        <div ref={ref} className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Quantidade: <span className="font-medium">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  }
);

// Comparison Badge
const ComparisonBadge = ({ comparison, suffix = '' }: { comparison: PeriodComparison; suffix?: string }) => {
  const Icon = comparison.changeType === 'positive' ? TrendingUp : 
               comparison.changeType === 'negative' ? TrendingDown : Minus;
  const colorClass = comparison.changeType === 'positive' ? 'text-emerald-500 bg-emerald-500/10' : 
                     comparison.changeType === 'negative' ? 'text-red-500 bg-red-500/10' : 
                     'text-muted-foreground bg-muted';
  
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colorClass)}>
      <Icon className="w-3 h-3" />
      {comparison.change > 0 ? '+' : ''}{comparison.change}%{suffix && ` ${suffix}`}
    </span>
  );
};

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  comparison, 
  icon: Icon, 
  iconColor 
}: { 
  title: string; 
  value: string | number; 
  comparison: PeriodComparison; 
  icon: React.ElementType; 
  iconColor: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-3 rounded-xl", iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <ComparisonBadge comparison={comparison} />
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Analytics = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const stats = getMetricsStats(period);
  const relationshipData = getRelationshipEvolutionData(period);
  const sentimentData = getSentimentDistributionData(period);
  const sentimentColors = getSentimentColors();
  const channelData = getEngagementByChannelData(period);
  const radarData = getEngagementRadarData(period);
  const topPerformers = getTopPerformersData();

  if (loading) {
    return (
      <AppLayout>
        <Header 
          title="Analytics" 
          subtitle="Métricas avançadas de relacionamento e engajamento"
        />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header 
        title="Analytics" 
        subtitle="Métricas avançadas de relacionamento e engajamento"
      />
      
      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />
        
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
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
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Interações"
            value={stats.totalInteractions.current}
            comparison={stats.totalInteractions}
            icon={MessageSquare}
            iconColor="bg-primary/10 text-primary"
          />
          <StatCard
            title="Score Médio"
            value={`${stats.avgScore.current}%`}
            comparison={stats.avgScore}
            icon={Heart}
            iconColor="bg-pink-500/10 text-pink-500"
          />
          <StatCard
            title="Taxa Positiva"
            value={`${stats.positiveRate.current}%`}
            comparison={stats.positiveRate}
            icon={TrendingUp}
            iconColor="bg-emerald-500/10 text-emerald-500"
          />
          <StatCard
            title="Engajamento"
            value={`${stats.engagementRate.current}%`}
            comparison={stats.engagementRate}
            icon={Zap}
            iconColor="bg-amber-500/10 text-amber-500"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-7xl grid-cols-10">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Avançado
            </TabsTrigger>
            <TabsTrigger value="disc" className="gap-1">
              <Brain className="w-3.5 h-3.5" />
              DISC
            </TabsTrigger>
            <TabsTrigger value="neuro" className="gap-1">
              <Zap className="w-3.5 h-3.5" />
              Neuro
            </TabsTrigger>
            <TabsTrigger value="rfm" className="gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              RFM
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-1">
              <Target className="w-3.5 h-3.5" />
              Inteligência
            </TabsTrigger>
            <TabsTrigger value="nlp" className="gap-1">
              <Brain className="w-3.5 h-3.5" />
              PNL
            </TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
            <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
          </TabsList>

          {/* Neuromarketing Tab - FULL ADVANCED SUITE */}
          <TabsContent value="neuro" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Main Neuro Portfolio Dashboard */}
              <NeuroPortfolioDashboard />
              
              {/* Neuro Radar + Timeline Row - Portfolio Aggregated View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NeuroRadarChart 
                  discProfile={null}
                  interactions={[]}
                  title="Balanço Neural Médio do Portfólio"
                />
                <NeuroTimeline
                  contactName="Portfólio Geral"
                  interactions={[]}
                  maxEntries={8}
                />
              </div>

              {/* Neuro Training Mode - Interactive Learning */}
              <NeuroTrainingMode />

              {/* Neuro Heatmap Calendar - Portfolio-Wide Contact Optimization */}
              <NeuroHeatmapCalendar
                contactName="Portfólio Geral"
              />

              {/* Neurochemical Influence Map - Educational Visual */}
              <NeurochemicalInfluenceMap />

              {/* Neuro A/B Tracker - Portfolio Aggregate (no contact filter) */}
              <NeuroABTracker
                contactName="Portfólio Completo"
              />
              
              {/* Neuro-Enriched Triggers */}
              <NeuroEnrichedTriggers showAll />
            </motion.div>
          </TabsContent>

          {/* DISC Analytics Tab */}
          <TabsContent value="disc" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Main DISC Analytics */}
              <DISCAnalyticsPanel />
              
              {/* DISC Training Mode */}
              <DISCTrainingMode />
              
              {/* DISC Conversion Metrics */}
              <DISCConversionMetrics />
            </motion.div>
          </TabsContent>

          {/* RFM Analysis Tab - Complete Dashboard */}
          <TabsContent value="rfm" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RFMAnalysisPanel />
            </motion.div>
          </TabsContent>

          {/* Intelligence Tab - New */}
          <TabsContent value="intelligence" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Closing Score Ranking - New */}
              <ClosingScoreRanking showStats maxItems={10} />

              {/* Churn Prediction - By Contact */}
              <ChurnPredictionPanel maxItems={10} />

              {/* Account-Level Churn Prediction - Based on Stakeholder Analysis */}
              <AccountChurnPredictionPanel />

              {/* Best Time + Deal Velocity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BestTimeToContactPanel />
                <DealVelocityPanel />
              </div>
            </motion.div>
          </TabsContent>

          {/* NLP Analytics Tab - Enterprise Module */}
          <TabsContent value="nlp" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Existing NLP Analytics */}
              <NLPAnalyticsPanel />
              
              {/* NLP Training Mode - Gamified Learning */}
              <NLPTrainingMode />
              
              {/* NLP Conversion Metrics - Performance Dashboard */}
              <NLPConversionMetrics />
              
              {/* ===================== ADVANCED NLP PORTFOLIO SUITE ===================== */}
              
              {/* RAPPORT TECHNIQUES - Portfolio Training */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RapportRealtimeCoach />
                <MiltonianCalibration />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IncongruenceDetector />
                <PerceptualPositions />
              </div>
              
              {/* DECISION STRATEGIES - Portfolio Training */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TOTEModelMapper />
                <HierarchyOfCriteria />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WellFormedOutcomeBuilder />
                <ChunkingNavigator />
              </div>
              
              {/* ANCHORS & STATES - Portfolio Training */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnchorTrackingSystem />
                <StateElicitationToolkit />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubmodalityModifier />
                <SwishPatternGenerator />
              </div>
              
              {/* ===================== END ADVANCED NLP PORTFOLIO SUITE ===================== */}
            </motion.div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Relationship Evolution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Evolução do Relacionamento
                    </CardTitle>
                    <CardDescription>
                      Score médio e novos contatos ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={relationshipData}>
                          <defs>
                            <linearGradient id="colorScoreAnalytics" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                          />
                          <YAxis 
                            yAxisId="left"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="score"
                            name="Score"
                            stroke="hsl(221, 83%, 53%)"
                            fill="url(#colorScoreAnalytics)"
                            strokeWidth={2}
                          />
                          <Bar
                            yAxisId="right"
                            dataKey="newContacts"
                            name="Novos Contatos"
                            fill="hsl(142, 76%, 36%)"
                            radius={[4, 4, 0, 0]}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Top Performers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Top Relacionamentos
                    </CardTitle>
                    <CardDescription>
                      Contatos com maior score de relacionamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topPerformers.map((performer, index) => (
                        <motion.div
                          key={performer.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.interactions} interações</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">{performer.score}</p>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                performer.sentiment === 'positivo' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {performer.sentiment}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement by Channel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Engajamento por Canal
                    </CardTitle>
                    <CardDescription>
                      Mensagens enviadas vs recebidas por canal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis 
                            type="category" 
                            dataKey="channel" 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            width={80}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="sent" name="Enviadas" fill="hsl(221, 83%, 53%)" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="received" name="Recebidas" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Engagement Radar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Métricas de Engajamento
                    </CardTitle>
                    <CardDescription>
                      Análise multidimensional do seu desempenho
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis 
                            dataKey="metric" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Radar
                            name="Atual"
                            dataKey="value"
                            stroke="hsl(221, 83%, 53%)"
                            fill="hsl(221, 83%, 53%)"
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Interactions Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Volume de Interações
                    </CardTitle>
                    <CardDescription>
                      Número de interações ao longo do período selecionado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={relationshipData}>
                          <defs>
                            <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(280, 67%, 45%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(280, 67%, 45%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="interactions"
                            name="Interações"
                            stroke="hsl(280, 67%, 45%)"
                            fill="url(#colorInteractions)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sentiment Distribution Pie */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-500" />
                      Distribuição de Sentimentos
                    </CardTitle>
                    <CardDescription>
                      Proporção de interações por tipo de sentimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sentimentData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                          >
                            {sentimentData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={sentimentColors[entry.name as keyof typeof sentimentColors]} 
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend with comparison */}
                    <div className="flex justify-center gap-6 mt-4">
                      {sentimentData.map((item) => {
                        const comparison = calcChange(item.value, item.prevValue);
                        return (
                          <div key={item.name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: sentimentColors[item.name as keyof typeof sentimentColors] }}
                            />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                            <ComparisonBadge comparison={comparison} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sentiment Over Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Evolução do Sentimento
                    </CardTitle>
                    <CardDescription>
                      Tendência de sentimentos ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={relationshipData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="score" 
                            name="Score de Relacionamento" 
                            fill="hsl(221, 83%, 53%)" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sentiment Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Insights de Sentimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium text-emerald-500">Positivo</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">
                          {sentimentData[0].value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((sentimentData[0].value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Minus className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">Neutro</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">
                          {sentimentData[1].value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((sentimentData[1].value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          <span className="font-medium text-red-500">Negativo</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">
                          {sentimentData[2].value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {Math.round((sentimentData[2].value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Triggers Tab */}
          <TabsContent value="triggers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TriggerAnalytics />
              <AdvancedTriggersPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Analytics;
