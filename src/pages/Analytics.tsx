import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Activity, Users,
  MessageSquare, Heart, Target, Zap, Calendar, Download, RefreshCw, Brain,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
import AdvancedAnalyticsTab from '@/components/analytics/AdvancedAnalyticsTab';
import { DISCTrainingMode, DISCConversionMetrics } from '@/components/disc';
import {
  NLPTrainingMode, NLPConversionMetrics,
  RapportRealtimeCoach, IncongruenceDetector, MiltonianCalibration,
  PerceptualPositions, TOTEModelMapper, HierarchyOfCriteria,
  WellFormedOutcomeBuilder, ChunkingNavigator, AnchorTrackingSystem,
  StateElicitationToolkit, SubmodalityModifier, SwishPatternGenerator,
} from '@/components/nlp';
import {
  NeuroEnrichedTriggers, NeuroRadarChart, NeuroTimeline,
  NeuroABTracker, NeuroHeatmapCalendar, NeuroTrainingMode,
  NeurochemicalInfluenceMap,
} from '@/components/neuromarketing';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import type { PeriodFilter } from '@/lib/tab-utils';

// Extracted data & shared components
import {
  periodOptions, calcChange, getMetricsStats,
  getRelationshipEvolutionData, getSentimentDistributionData,
  getSentimentColors, getEngagementByChannelData,
  getEngagementRadarData, getTopPerformersData,
} from '@/data/analyticsData';
import { CustomTooltip, PieTooltip, ComparisonBadge, StatCard } from '@/components/analytics/AnalyticsShared';

const Analytics = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
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
        <Header title="Analytics" subtitle="Métricas avançadas de relacionamento e engajamento" />
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Analytics" description="Métricas avançadas de relacionamento e engajamento" />
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
                {periodOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />Exportar
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="w-4 h-4" />Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total de Interações" value={stats.totalInteractions.current} comparison={stats.totalInteractions} icon={MessageSquare} iconColor="bg-primary/10 text-primary" />
          <StatCard title="Score Médio" value={`${stats.avgScore.current}%`} comparison={stats.avgScore} icon={Heart} iconColor="bg-pink-500/10 text-pink-500" />
          <StatCard title="Taxa Positiva" value={`${stats.positiveRate.current}%`} comparison={stats.positiveRate} icon={TrendingUp} iconColor="bg-emerald-500/10 text-emerald-500" />
          <StatCard title="Engajamento" value={`${stats.engagementRate.current}%`} comparison={stats.engagementRate} icon={Zap} iconColor="bg-amber-500/10 text-amber-500" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-7xl grid-cols-10">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="advanced" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />Avançado</TabsTrigger>
            <TabsTrigger value="disc" className="gap-1"><Brain className="w-3.5 h-3.5" />DISC</TabsTrigger>
            <TabsTrigger value="neuro" className="gap-1"><Zap className="w-3.5 h-3.5" />Neuro</TabsTrigger>
            <TabsTrigger value="rfm" className="gap-1"><BarChart3 className="w-3.5 h-3.5" />RFM</TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-1"><Target className="w-3.5 h-3.5" />Inteligência</TabsTrigger>
            <TabsTrigger value="nlp" className="gap-1"><Brain className="w-3.5 h-3.5" />PNL</TabsTrigger>
            <TabsTrigger value="engagement">Engajamento</TabsTrigger>
            <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
            <TabsTrigger value="triggers">Gatilhos</TabsTrigger>
          </TabsList>

          <TabsContent value="advanced" className="space-y-6"><AdvancedAnalyticsTab /></TabsContent>

          <TabsContent value="neuro" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <NeuroPortfolioDashboard />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NeuroRadarChart discProfile={null} interactions={[]} title="Balanço Neural Médio do Portfólio" />
                <NeuroTimeline contactName="Portfólio Geral" interactions={[]} maxEntries={8} />
              </div>
              <NeuroTrainingMode />
              <NeuroHeatmapCalendar contactName="Portfólio Geral" />
              <NeurochemicalInfluenceMap />
              <NeuroABTracker contactName="Portfólio Completo" />
              <NeuroEnrichedTriggers showAll />
            </motion.div>
          </TabsContent>

          <TabsContent value="disc" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <DISCAnalyticsPanel />
              <DISCTrainingMode />
              <DISCConversionMetrics />
            </motion.div>
          </TabsContent>

          <TabsContent value="rfm" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <RFMAnalysisPanel />
            </motion.div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <ClosingScoreRanking showStats maxItems={10} />
              <ChurnPredictionPanel maxItems={10} />
              <AccountChurnPredictionPanel />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BestTimeToContactPanel />
                <DealVelocityPanel />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="nlp" className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <NLPAnalyticsPanel />
              <NLPTrainingMode />
              <NLPConversionMetrics />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><RapportRealtimeCoach /><MiltonianCalibration /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><IncongruenceDetector /><PerceptualPositions /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><TOTEModelMapper /><HierarchyOfCriteria /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><WellFormedOutcomeBuilder /><ChunkingNavigator /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><AnchorTrackingSystem /><StateElicitationToolkit /></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><SubmodalityModifier /><SwishPatternGenerator /></div>
            </motion.div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />Evolução do Relacionamento
                    </CardTitle>
                    <CardDescription>Score médio e novos contatos ao longo do tempo</CardDescription>
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
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="score" name="Score" stroke="hsl(221, 83%, 53%)" fill="url(#colorScoreAnalytics)" strokeWidth={2} />
                          <Bar yAxisId="right" dataKey="newContacts" name="Novos Contatos" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />Top Relacionamentos
                    </CardTitle>
                    <CardDescription>Contatos com maior score de relacionamento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topPerformers.map((performer, index) => (
                        <motion.div key={performer.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{performer.name}</p>
                            <p className="text-sm text-muted-foreground">{performer.interactions} interações</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">{performer.score}</p>
                            <Badge variant="outline" className={cn("text-xs", performer.sentiment === 'positivo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-muted text-muted-foreground')}>
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Engajamento por Canal</CardTitle>
                    <CardDescription>Mensagens enviadas vs recebidas por canal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={channelData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis type="category" dataKey="channel" tick={{ fill: 'hsl(var(--muted-foreground))' }} width={80} />
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

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Métricas de Engajamento</CardTitle>
                    <CardDescription>Análise multidimensional do seu desempenho</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Radar name="Atual" dataKey="value" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.3} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Volume de Interações</CardTitle>
                    <CardDescription>Número de interações ao longo do período selecionado</CardDescription>
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
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="interactions" name="Interações" stroke="hsl(280, 67%, 45%)" fill="url(#colorInteractions)" strokeWidth={2} />
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" />Distribuição de Sentimentos</CardTitle>
                    <CardDescription>Proporção de interações por tipo de sentimento</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}>
                            {sentimentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={sentimentColors[entry.name as keyof typeof sentimentColors]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      {sentimentData.map((item) => {
                        const comparison = calcChange(item.value, item.prevValue);
                        return (
                          <div key={item.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sentimentColors[item.name as keyof typeof sentimentColors] }} />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                            <ComparisonBadge comparison={comparison} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" />Evolução do Sentimento</CardTitle>
                    <CardDescription>Tendência de sentimentos ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={relationshipData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="score" name="Score de Relacionamento" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" />Insights de Sentimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" /><span className="font-medium text-emerald-500">Positivo</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{sentimentData[0]?.value}</p>
                        <p className="text-sm text-muted-foreground">{Math.round((sentimentData[0]?.value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Minus className="w-4 h-4 text-muted-foreground" /><span className="font-medium text-muted-foreground">Neutro</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{sentimentData[1]?.value}</p>
                        <p className="text-sm text-muted-foreground">{Math.round((sentimentData[1]?.value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="w-4 h-4 text-red-500" /><span className="font-medium text-red-500">Negativo</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground mb-1">{sentimentData[2]?.value}</p>
                        <p className="text-sm text-muted-foreground">{Math.round((sentimentData[2]?.value / sentimentData.reduce((a, b) => a + b.value, 0)) * 100)}% do total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

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
