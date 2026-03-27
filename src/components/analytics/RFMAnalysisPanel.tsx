import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Users,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRFMAnalysis } from '@/hooks/useRFMAnalysis';
import { RFM_SEGMENTS, RFMSegment } from '@/types/rfm';
import { SEGMENT_ICONS, SEGMENT_COLORS } from './RFMConstants';
import { MetricCard, RFMOverviewCharts } from './RFMOverviewCharts';
import { RFMSegmentGrid } from './RFMSegmentGrid';
import { RFMContactList } from './RFMContactList';
import { RFMContactDetail } from './RFMContactDetail';
import { RFMActionsOverview } from './RFMActionsOverview';

interface RFMAnalysisPanelProps {
  compact?: boolean;
  contactId?: string;
}

export function RFMAnalysisPanel({ compact = false, contactId }: RFMAnalysisPanelProps) {
  const {
    rfmData,
    contactRFM,
    history,
    dashboardStats,
    contactSummaries,
    loading,
    analyzing,
    runAnalysis,
    refresh
  } = useRFMAnalysis(contactId);

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contactSummaries.filter(summary => {
      if (!summary.rfmAnalysis) return false;

      const matchesSearch = summary.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSegment = segmentFilter === 'all' || summary.rfmAnalysis.segment === segmentFilter;
      const matchesPriority = priorityFilter === 'all' || summary.rfmAnalysis.communicationPriority === priorityFilter;

      return matchesSearch && matchesSegment && matchesPriority;
    });
  }, [contactSummaries, searchTerm, segmentFilter, priorityFilter]);

  // Chart data
  const segmentChartData = useMemo(() => {
    return Object.entries(dashboardStats.segmentDistribution)
      .filter(([_, count]) => count > 0)
      .map(([segment, count]) => ({
        name: RFM_SEGMENTS[segment as RFMSegment].name,
        value: count,
        color: SEGMENT_COLORS[segment as RFMSegment]
      }))
      .sort((a, b) => b.value - a.value);
  }, [dashboardStats.segmentDistribution]);

  const scoreDistributionData = useMemo(() => {
    return [1, 2, 3, 4, 5].map(score => ({
      score: score.toString(),
      Recência: dashboardStats.scoreDistribution.recency[score] || 0,
      Frequência: dashboardStats.scoreDistribution.frequency[score] || 0,
      Monetário: dashboardStats.scoreDistribution.monetary[score] || 0
    }));
  }, [dashboardStats.scoreDistribution]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Single contact view
  if (contactId && contactRFM) {
    return (
      <RFMContactDetail
        rfm={contactRFM}
        history={history}
        onRefresh={runAnalysis}
        analyzing={analyzing}
      />
    );
  }

  // Compact dashboard view
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Análise RFM</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={runAnalysis}
              disabled={analyzing}
            >
              <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Campeões</div>
              <div className="text-2xl font-bold text-emerald-600">
                {dashboardStats.segmentDistribution.champions || 0}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Em Risco</div>
              <div className="text-2xl font-bold text-red-600">
                {(dashboardStats.segmentDistribution.at_risk || 0) +
                 (dashboardStats.segmentDistribution.cant_lose || 0)}
              </div>
            </div>
          </div>

          {/* Mini Segment Distribution */}
          <div className="space-y-2">
            {segmentChartData.slice(0, 4).map(segment => (
              <div key={segment.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm flex-1">{segment.name}</span>
                <span className="text-sm font-medium">{segment.value}</span>
              </div>
            ))}
          </div>

          <Link to="/analytics?tab=rfm">
            <Button variant="outline" size="sm" className="w-full">
              Ver Análise Completa
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Full dashboard view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise RFM Completa</h2>
          <p className="text-muted-foreground">
            Segmentação baseada em Recência, Frequência e Valor Monetário
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Executar Análise
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Contatos Analisados"
          value={dashboardStats.totalAnalyzed}
          color="blue"
        />
        <MetricCard
          icon={<Target className="h-5 w-5" />}
          label="Score RFM Médio"
          value={dashboardStats.averageRfmScore.toFixed(1)}
          suffix="/15"
          color="purple"
        />
        <MetricCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Receita em Risco"
          value={`R$ ${(dashboardStats.atRiskRevenue / 1000).toFixed(1)}k`}
          color="red"
          trend="down"
        />
        <MetricCard
          icon={<Trophy className="h-5 w-5" />}
          label="Receita Campeões"
          value={`R$ ${(dashboardStats.championsRevenue / 1000).toFixed(1)}k`}
          color="emerald"
          trend="up"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RFMOverviewCharts
            segmentChartData={segmentChartData}
            scoreDistributionData={scoreDistributionData}
            dashboardStats={dashboardStats}
          />
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <RFMSegmentGrid
            segmentDistribution={dashboardStats.segmentDistribution}
            totalAnalyzed={dashboardStats.totalAnalyzed}
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <RFMContactList
            filteredContacts={filteredContacts}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            segmentFilter={segmentFilter}
            onSegmentFilterChange={setSegmentFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
          />
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <RFMActionsOverview rfmData={rfmData} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default RFMAnalysisPanel;
