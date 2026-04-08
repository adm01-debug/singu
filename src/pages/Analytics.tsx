import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  MessageSquare,
  Heart,
  Zap,
  Calendar,
  Download,
  RefreshCw,
  Brain,
  BarChart3,
  Target,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { TriggerAnalytics } from '@/components/triggers/TriggerAnalytics';
import { AdvancedTriggersPanel } from '@/components/triggers/AdvancedTriggersPanel';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import DISCAnalyticsPanel from '@/components/analytics/DISCAnalyticsPanel';
import { DISCTrainingMode, DISCConversionMetrics } from '@/components/disc';
import { RFMAnalysisPanel } from '@/components/analytics/RFMAnalysisPanel';

// Extracted sub-components
import type { PeriodFilter } from '@/components/analytics/analyticsData';
import { periodOptions, useAnalyticsData } from '@/components/analytics/analyticsData';
import { StatCard } from '@/components/analytics/AnalyticsShared';
import { OverviewTabContent } from '@/components/analytics/OverviewTabContent';
import { EngagementTabContent } from '@/components/analytics/EngagementTabContent';
import { SentimentTabContent } from '@/components/analytics/SentimentTabContent';
import { NeuroTabContent } from '@/components/analytics/NeuroTabContent';
import { NLPTabContent } from '@/components/analytics/NLPTabContent';
import { IntelligenceTabContent } from '@/components/analytics/IntelligenceTabContent';

const Analytics = () => {
  useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const {
    loading,
    stats,
    relationshipEvolution,
    topPerformers,
    sentimentDistribution,
    engagementByChannel,
    engagementRadar,
  } = useAnalyticsData(period);

  if (loading) {
    return (
      <AppLayout>
        <Header title="Analytics" subtitle="Métricas avançadas de relacionamento e engajamento" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title="Analytics" subtitle="Métricas avançadas de relacionamento e engajamento" />

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
                {periodOptions.map((opt) => (
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
          <TabsList className="grid w-full max-w-6xl grid-cols-9">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
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

          {/* Neuromarketing Tab */}
          <TabsContent value="neuro" className="space-y-6">
            <NeuroTabContent />
          </TabsContent>

          {/* DISC Analytics Tab */}
          <TabsContent value="disc" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <DISCAnalyticsPanel />
              <DISCTrainingMode />
              <DISCConversionMetrics />
            </motion.div>
          </TabsContent>

          {/* RFM Analysis Tab */}
          <TabsContent value="rfm" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <RFMAnalysisPanel />
            </motion.div>
          </TabsContent>

          {/* Intelligence Tab */}
          <TabsContent value="intelligence" className="space-y-6">
            <IntelligenceTabContent />
          </TabsContent>

          {/* NLP Analytics Tab */}
          <TabsContent value="nlp" className="space-y-6">
            <NLPTabContent />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTabContent
              relationshipData={relationshipEvolution}
              topPerformers={topPerformers}
            />
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <EngagementTabContent
              channelData={engagementByChannel}
              radarData={engagementRadar}
              relationshipData={relationshipEvolution}
            />
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <SentimentTabContent
              sentimentData={sentimentDistribution}
              relationshipData={relationshipEvolution}
            />
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
