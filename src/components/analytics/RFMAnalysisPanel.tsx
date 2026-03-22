import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  Trophy,
  Heart,
  Star,
  Sparkles,
  TrendingUp,
  Bell,
  Moon,
  AlertTriangle,
  ShieldAlert,
  PauseCircle,
  XCircle,
  RefreshCw,
  ChevronRight,
  DollarSign,
  Users,
  Clock,
  Target,
  Zap,
  BarChart3,
  PieChartIcon,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Filter,
  Download,
  Search,
  Info,
  TrendingDown,
  Percent
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRFMAnalysis } from '@/hooks/useRFMAnalysis';
import { RFM_SEGMENTS, RFMSegment, RFMAnalysis } from '@/types/rfm';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RFMAnalysisPanelProps {
  compact?: boolean;
  contactId?: string;
}

const SEGMENT_ICONS: Record<RFMSegment, React.ReactNode> = {
  champions: <Trophy className="h-4 w-4" />,
  loyal_customers: <Heart className="h-4 w-4" />,
  potential_loyalists: <Star className="h-4 w-4" />,
  recent_customers: <Sparkles className="h-4 w-4" />,
  promising: <TrendingUp className="h-4 w-4" />,
  needing_attention: <Bell className="h-4 w-4" />,
  about_to_sleep: <Moon className="h-4 w-4" />,
  at_risk: <AlertTriangle className="h-4 w-4" />,
  cant_lose: <ShieldAlert className="h-4 w-4" />,
  hibernating: <PauseCircle className="h-4 w-4" />,
  lost: <XCircle className="h-4 w-4" />
};

const SEGMENT_COLORS: Record<RFMSegment, string> = {
  champions: '#10b981',
  loyal_customers: '#22c55e',
  potential_loyalists: '#06b6d4',
  recent_customers: '#3b82f6',
  promising: '#6366f1',
  needing_attention: '#eab308',
  about_to_sleep: '#f97316',
  at_risk: '#ef4444',
  cant_lose: '#dc2626',
  hibernating: '#6b7280',
  lost: '#9ca3af'
};

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
      <ContactRFMDetail 
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Segment Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Distribuição por Segmento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {segmentChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribuição de Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="score" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="Recência" fill="#3b82f6" />
                      <Bar dataKey="Frequência" fill="#22c55e" />
                      <Bar dataKey="Monetário" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Prioridade de Comunicação</CardTitle>
              <CardDescription>
                Distribuição de contatos por urgência de contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <PriorityCard
                  label="Urgente"
                  count={dashboardStats.priorityDistribution.urgent}
                  total={dashboardStats.totalAnalyzed}
                  color="red"
                />
                <PriorityCard
                  label="Alta"
                  count={dashboardStats.priorityDistribution.high}
                  total={dashboardStats.totalAnalyzed}
                  color="orange"
                />
                <PriorityCard
                  label="Média"
                  count={dashboardStats.priorityDistribution.medium}
                  total={dashboardStats.totalAnalyzed}
                  color="blue"
                />
                <PriorityCard
                  label="Baixa"
                  count={dashboardStats.priorityDistribution.low}
                  total={dashboardStats.totalAnalyzed}
                  color="gray"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(RFM_SEGMENTS).map(([key, segment]) => {
              const count = dashboardStats.segmentDistribution[key as RFMSegment] || 0;
              const percentage = dashboardStats.totalAnalyzed > 0
                ? Math.round((count / dashboardStats.totalAnalyzed) * 100)
                : 0;
              
              return (
                <SegmentCard
                  key={key}
                  segmentKey={key as RFMSegment}
                  segment={segment}
                  count={count}
                  percentage={percentage}
                  icon={SEGMENT_ICONS[key as RFMSegment]}
                />
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Segmentos</SelectItem>
                {Object.entries(RFM_SEGMENTS).map(([key, seg]) => (
                  <SelectItem key={key} value={key}>{seg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contacts List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredContacts.map(summary => (
                <ContactRFMCard key={summary.contactId} summary={summary} />
              ))}
              {filteredContacts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum contato encontrado com os filtros aplicados
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <ActionsOverview rfmData={rfmData} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// Sub-components
function MetricCard({ 
  icon, 
  label, 
  value, 
  suffix = '', 
  color, 
  trend 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  suffix?: string;
  color: string;
  trend?: 'up' | 'down';
}) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-950/50',
    red: 'bg-red-100 text-red-600 dark:bg-red-950/50',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50'
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          {trend && (
            <div className={trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
              {trend === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-2xl font-bold">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
          </div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityCard({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number; 
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  const colorClasses: Record<string, { bg: string; bar: string }> = {
    red: { bg: 'bg-red-100 dark:bg-red-950/30', bar: 'bg-red-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-950/30', bar: 'bg-orange-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-950/30', bar: 'bg-blue-500' },
    gray: { bg: 'bg-muted', bar: 'bg-muted-foreground' }
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color].bg}`}>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{count}</div>
      <div className="mt-2">
        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClasses[color].bar} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">{percentage}%</div>
      </div>
    </div>
  );
}

function SegmentCard({ 
  segmentKey, 
  segment, 
  count, 
  percentage, 
  icon 
}: { 
  segmentKey: RFMSegment;
  segment: typeof RFM_SEGMENTS[RFMSegment];
  count: number;
  percentage: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${segment.bgColor} ${segment.color}`}>
            {icon}
          </div>
          <Badge variant="secondary">{count}</Badge>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold">{segment.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
        </div>
        <div className="mt-4">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">{percentage}% do total</span>
            <span className="text-xs text-muted-foreground">{segment.actionFocus}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactRFMCard({ summary }: { summary: any }) {
  const rfm = summary.rfmAnalysis;
  if (!rfm) return null;
  
  const segment = RFM_SEGMENTS[rfm.segment];
  
  return (
    <Link to={`/contatos/${summary.contactId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              {summary.avatarUrl ? (
                <img 
                  src={summary.avatarUrl} 
                  alt={summary.contactName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium">
                  {summary.contactName.charAt(0)}
                </span>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{summary.contactName}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${segment.bgColor} ${segment.color} border-0`}>
                  {SEGMENT_ICONS[rfm.segment]}
                  <span className="ml-1">{segment.name}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  R$ {rfm.totalMonetaryValue.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
            
            {/* RFM Scores */}
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">R</div>
                      <div className="font-bold">{rfm.recencyScore}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Recência</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">F</div>
                      <div className="font-bold">{rfm.frequencyScore}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Frequência</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">M</div>
                      <div className="font-bold">{rfm.monetaryScore}</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Monetário</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Priority */}
            <div>
              <PriorityBadge priority={rfm.communicationPriority} />
            </div>
            
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; label: string }> = {
    urgent: { color: 'bg-red-100 text-red-700', label: 'Urgente' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'Alta' },
    medium: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
    low: { color: 'bg-gray-100 text-gray-700', label: 'Baixa' }
  };
  
  const cfg = config[priority] || config.medium;
  
  return (
    <Badge className={`${cfg.color} border-0`}>
      {cfg.label}
    </Badge>
  );
}

function ContactRFMDetail({ 
  rfm, 
  history, 
  onRefresh,
  analyzing 
}: { 
  rfm: RFMAnalysis; 
  history: any[];
  onRefresh: () => void;
  analyzing: boolean;
}) {
  const segment = RFM_SEGMENTS[rfm.segment];
  
  const historyChartData = useMemo(() => {
    return history.slice().reverse().map(h => ({
      date: format(h.recordedAt, 'dd/MM', { locale: ptBR }),
      R: h.recencyScore,
      F: h.frequencyScore,
      M: h.monetaryScore,
      total: h.recencyScore + h.frequencyScore + h.monetaryScore
    }));
  }, [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${segment.bgColor} ${segment.color}`}>
                {SEGMENT_ICONS[rfm.segment]}
              </div>
              <div>
                <CardTitle>Análise RFM</CardTitle>
                <CardDescription>
                  Última análise: {format(rfm.analyzedAt, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={analyzing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Segment Badge */}
          <div className={`p-4 rounded-lg ${segment.bgColor}`}>
            <div className="flex items-center gap-2">
              {SEGMENT_ICONS[rfm.segment]}
              <span className={`font-semibold ${segment.color}`}>{segment.name}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{segment.description}</p>
            <p className="text-sm mt-2">
              <strong>Foco:</strong> {segment.actionFocus}
            </p>
          </div>

          {/* RFM Scores */}
          <div className="grid grid-cols-3 gap-4">
            <ScoreCard
              label="Recência"
              score={rfm.recencyScore}
              detail={rfm.daysSinceLastPurchase ? `${rfm.daysSinceLastPurchase} dias` : 'N/A'}
              color="blue"
              trend={rfm.recencyTrend}
            />
            <ScoreCard
              label="Frequência"
              score={rfm.frequencyScore}
              detail={`${rfm.totalPurchases} compras`}
              color="green"
              trend={rfm.frequencyTrend}
            />
            <ScoreCard
              label="Monetário"
              score={rfm.monetaryScore}
              detail={`R$ ${rfm.totalMonetaryValue.toLocaleString('pt-BR')}`}
              color="amber"
              trend={rfm.monetaryTrend}
            />
          </div>

          {/* Combined Score */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Score RFM Total</div>
                <div className="text-3xl font-bold">{rfm.totalScore}/15</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Código RFM</div>
                <div className="text-2xl font-mono font-bold">
                  {rfm.recencyScore}{rfm.frequencyScore}{rfm.monetaryScore}
                </div>
              </div>
            </div>
            <Progress value={(rfm.totalScore / 15) * 100} className="mt-3" />
          </div>

          {/* Predictions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Próxima Compra Prevista</span>
              </div>
              <div className="text-lg font-semibold mt-1">
                {rfm.predictedNextPurchaseDate
                  ? format(rfm.predictedNextPurchaseDate, "dd 'de' MMM", { locale: ptBR })
                  : 'Indeterminado'}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span className="text-sm">Probabilidade de Churn</span>
              </div>
              <div className={`text-lg font-semibold mt-1 ${
                (rfm.churnProbability || 0) > 50 ? 'text-red-600' : 
                (rfm.churnProbability || 0) > 25 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {rfm.churnProbability?.toFixed(0) || 0}%
              </div>
            </div>
          </div>

          {/* History Chart */}
          {historyChartData.length > 1 && (
            <div>
              <h4 className="font-semibold mb-3">Evolução do Score</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="R" stroke="#3b82f6" name="Recência" />
                    <Line type="monotone" dataKey="F" stroke="#22c55e" name="Frequência" />
                    <Line type="monotone" dataKey="M" stroke="#f59e0b" name="Monetário" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {rfm.recommendedActions.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ações Recomendadas</h4>
              <div className="space-y-2">
                {rfm.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="bg-primary/10 text-primary p-2 rounded-full">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{action.action}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{action.channel}</Badge>
                        <Badge variant="outline">{action.timing}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Offers */}
          {rfm.recommendedOffers.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Ofertas Sugeridas</h4>
              <div className="grid grid-cols-2 gap-3">
                {rfm.recommendedOffers.map((offer, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <div className="font-medium">{offer.offerType}</div>
                    <div className="text-sm text-muted-foreground">{offer.description}</div>
                    {offer.discountPercent && (
                      <Badge className="mt-2 bg-green-100 text-green-700">
                        {offer.discountPercent}% OFF
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ScoreCard({ 
  label, 
  score, 
  detail, 
  color,
  trend 
}: { 
  label: string; 
  score: number; 
  detail: string;
  color: string;
  trend?: string | null;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700'
  };

  const TrendIcon = trend === 'improving' ? ArrowUp : 
                    trend === 'declining' ? ArrowDown : Minus;
  const trendColor = trend === 'improving' ? 'text-green-600' : 
                     trend === 'declining' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className={`p-4 rounded-lg ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
      <div className="text-3xl font-bold mt-1">{score}</div>
      <div className="text-sm opacity-80">{detail}</div>
    </div>
  );
}

function ActionsOverview({ rfmData }: { rfmData: RFMAnalysis[] }) {
  const actionsByPriority = useMemo(() => {
    const urgent: any[] = [];
    const high: any[] = [];
    const medium: any[] = [];
    
    rfmData.forEach(rfm => {
      const item = {
        contactId: rfm.contactId,
        segment: rfm.segment,
        actions: rfm.recommendedActions,
        priority: rfm.communicationPriority
      };
      
      if (rfm.communicationPriority === 'urgent') urgent.push(item);
      else if (rfm.communicationPriority === 'high') high.push(item);
      else medium.push(item);
    });
    
    return { urgent, high, medium };
  }, [rfmData]);

  return (
    <div className="space-y-6">
      {/* Urgent Actions */}
      {actionsByPriority.urgent.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Ações Urgentes ({actionsByPriority.urgent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionsByPriority.urgent.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-background rounded-lg">
                  <div className={`p-2 rounded-lg ${RFM_SEGMENTS[item.segment as RFMSegment].bgColor}`}>
                    {SEGMENT_ICONS[item.segment as RFMSegment]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.actions[0]?.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.actions[0]?.description}
                    </div>
                  </div>
                  <Link to={`/contatos/${item.contactId}`}>
                    <Button size="sm">Ver Contato</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Priority */}
      {actionsByPriority.high.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Bell className="h-5 w-5" />
              Alta Prioridade ({actionsByPriority.high.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionsByPriority.high.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {SEGMENT_ICONS[item.segment as RFMSegment]}
                    <span>{item.actions[0]?.action}</span>
                  </div>
                  <Link to={`/contatos/${item.contactId}`}>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default RFMAnalysisPanel;
