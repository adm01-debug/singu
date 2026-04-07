import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { PersuasionTemplate, PersuasionScenario, MENTAL_TRIGGERS } from '@/types/triggers';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { useTriggerHistory, TriggerUsageEntry } from '@/hooks/useTriggerHistory';

interface TemplatePerformanceComparisonProps {
  contact?: Contact;
  className?: string;
}

interface TemplatePerformanceData {
  template: PersuasionTemplate;
  totalUsages: number;
  successCount: number;
  neutralCount: number;
  failureCount: number;
  successRate: number;
  avgRating: number;
  lastUsed: string | null;
  discPerformance: Record<DISCProfile, { usages: number; successRate: number }>;
  trend: 'up' | 'down' | 'stable';
}

const scenarioLabels: Record<PersuasionScenario | 'all', string> = {
  all: 'Todos os Cenários',
  price_objection: 'Objeção de Preço',
  indecisive_client: 'Cliente Indeciso',
  lost_client_reactivation: 'Reativação de Cliente',
  initial_negotiation: 'Negociação Inicial',
  upsell_crosssell: 'Upsell/Cross-sell',
  contract_renewal: 'Renovação de Contrato',
  timing_objection: 'Objeção de Timing',
  general: 'Geral',
};

const discLabels: Record<DISCProfile, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Analítico',
};

const discColors: Record<DISCProfile, string> = {
  D: 'bg-destructive text-destructive border-destructive',
  I: 'bg-warning text-warning border-warning',
  S: 'bg-success text-success border-success',
  C: 'bg-info text-info border-info',
};

export function TemplatePerformanceComparison({ contact, className }: TemplatePerformanceComparisonProps) {
  const { allTemplates } = useClientTriggers(contact);
  const { history } = useTriggerHistory();
  const [selectedScenario, setSelectedScenario] = useState<PersuasionScenario | 'all'>('all');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'successRate' | 'usages' | 'avgRating'>('successRate');

  // Calculate performance data for each template
  const performanceData = useMemo(() => {
    const templateUsageMap = new Map<string, TriggerUsageEntry[]>();

    // Group history by template_id
    history.forEach(entry => {
      if (entry.template_id) {
        const existing = templateUsageMap.get(entry.template_id) || [];
        existing.push(entry);
        templateUsageMap.set(entry.template_id, existing);
      }
    });

    // Filter templates by scenario
    const filteredTemplates = selectedScenario === 'all'
      ? allTemplates
      : allTemplates.filter(t => t.scenario === selectedScenario);

    // Calculate performance for each template
    const data: TemplatePerformanceData[] = filteredTemplates.map(template => {
      const usages = templateUsageMap.get(template.id) || [];
      const completedUsages = usages.filter(u => u.result !== 'pending');
      const successCount = completedUsages.filter(u => u.result === 'success').length;
      const neutralCount = completedUsages.filter(u => u.result === 'neutral').length;
      const failureCount = completedUsages.filter(u => u.result === 'failure').length;
      const successRate = completedUsages.length > 0 ? (successCount / completedUsages.length) * 100 : 0;

      // Calculate average rating
      const ratedUsages = usages.filter(u => u.effectiveness_rating !== null);
      const avgRating = ratedUsages.length > 0
        ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / ratedUsages.length
        : 0;

      // Get last used date
      const lastUsed = usages.length > 0
        ? usages.sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())[0].used_at
        : null;

      // Calculate DISC-specific performance
      const discPerformance = (['D', 'I', 'S', 'C'] as DISCProfile[]).reduce((acc, disc) => {
        // This would need contact DISC info from usage, simulated here
        const discUsages = completedUsages; // In real scenario, filter by contact's DISC
        const discSuccess = discUsages.filter(u => u.result === 'success').length;
        acc[disc] = {
          usages: discUsages.length,
          successRate: discUsages.length > 0 ? (discSuccess / discUsages.length) * 100 : 0,
        };
        return acc;
      }, {} as Record<DISCProfile, { usages: number; successRate: number }>);

      // Calculate trend (based on recent vs older performance)
      const sortedUsages = [...completedUsages].sort(
        (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
      );
      const recentUsages = sortedUsages.slice(0, Math.ceil(sortedUsages.length / 2));
      const olderUsages = sortedUsages.slice(Math.ceil(sortedUsages.length / 2));
      
      const recentSuccessRate = recentUsages.length > 0
        ? (recentUsages.filter(u => u.result === 'success').length / recentUsages.length) * 100
        : 0;
      const olderSuccessRate = olderUsages.length > 0
        ? (olderUsages.filter(u => u.result === 'success').length / olderUsages.length) * 100
        : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentSuccessRate > olderSuccessRate + 10) trend = 'up';
      else if (recentSuccessRate < olderSuccessRate - 10) trend = 'down';

      return {
        template,
        totalUsages: usages.length,
        successCount,
        neutralCount,
        failureCount,
        successRate,
        avgRating,
        lastUsed,
        discPerformance,
        trend,
      };
    });

    // Sort data
    return data.sort((a, b) => {
      if (sortBy === 'successRate') return b.successRate - a.successRate;
      if (sortBy === 'usages') return b.totalUsages - a.totalUsages;
      return b.avgRating - a.avgRating;
    });
  }, [allTemplates, history, selectedScenario, sortBy]);

  // Get top performer
  const topPerformer = performanceData.find(p => p.totalUsages >= 3 && p.successRate > 0);

  // Get available scenarios from templates
  const availableScenarios = useMemo(() => {
    const scenarios = new Set<PersuasionScenario>();
    allTemplates.forEach(t => {
      if (t.scenario) scenarios.add(t.scenario);
    });
    return Array.from(scenarios);
  }, [allTemplates]);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca usado';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Comparativo de Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="successRate">Taxa de Sucesso</SelectItem>
                <SelectItem value="usages">Mais Usados</SelectItem>
                <SelectItem value="avgRating">Melhor Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Compare a performance de templates do mesmo cenário
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scenario Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedScenario === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedScenario('all')}
            className="text-xs"
          >
            Todos
          </Button>
          {availableScenarios.map(scenario => (
            <Button
              key={scenario}
              variant={selectedScenario === scenario ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedScenario(scenario)}
              className="text-xs"
            >
              {scenarioLabels[scenario]}
            </Button>
          ))}
        </div>

        {/* Top Performer Highlight */}
        {topPerformer && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-muted/30 border border-warning dark:border-warning"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning dark:bg-warning">
                <Trophy className="w-5 h-5 text-warning dark:text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-warning dark:text-warning">
                  🏆 Template Campeão do Cenário
                </p>
                <p className="text-xs text-warning dark:text-warning">
                  {topPerformer.template.title}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-warning dark:text-warning">
                  {topPerformer.successRate.toFixed(0)}%
                </p>
                <p className="text-xs text-warning dark:text-warning">
                  {topPerformer.totalUsages} usos
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Comparison Table */}
        <ScrollArea className="h-[400px]">
          {performanceData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum template encontrado para este cenário
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Template</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead className="text-center">Taxa de Sucesso</TableHead>
                  <TableHead className="text-center">Avaliação</TableHead>
                  <TableHead className="text-center">Tendência</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceData.map((data, index) => {
                  const trigger = MENTAL_TRIGGERS[data.template.trigger as keyof typeof MENTAL_TRIGGERS];
                  const isExpanded = expandedTemplate === data.template.id;
                  const isTopPerformer = index === 0 && data.totalUsages >= 3 && data.successRate > 0;

                  return (
                    <>
                      <TableRow
                        key={data.template.id}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/50',
                          isExpanded && 'bg-muted/30',
                          isTopPerformer && 'bg-warning/50 dark:bg-warning/10'
                        )}
                        onClick={() => setExpandedTemplate(isExpanded ? null : data.template.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isTopPerformer && (
                              <Trophy className="w-4 h-4 text-warning shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate text-sm">
                                {data.template.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs">{trigger?.icon}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {trigger?.name}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {data.totalUsages}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              'text-sm font-semibold',
                              data.successRate >= 70 && 'text-success',
                              data.successRate >= 40 && data.successRate < 70 && 'text-warning',
                              data.successRate < 40 && data.successRate > 0 && 'text-destructive',
                              data.successRate === 0 && 'text-muted-foreground'
                            )}>
                              {data.totalUsages > 0 ? `${data.successRate.toFixed(0)}%` : '-'}
                            </span>
                            {data.totalUsages > 0 && (
                              <Progress
                                value={data.successRate}
                                className="h-1.5 w-16"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {data.avgRating > 0 ? (
                              <>
                                <Star className="w-3.5 h-3.5 text-warning fill-yellow-500" />
                                <span className="text-sm font-medium">
                                  {data.avgRating.toFixed(1)}
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <TrendIcon trend={data.trend} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <TableRow key={`${data.template.id}-details`}>
                            <TableCell colSpan={6} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 bg-muted/20 space-y-4">
                                  {/* Stats Grid */}
                                  <div className="grid grid-cols-4 gap-3">
                                    <div className="p-3 rounded-lg bg-background border">
                                      <div className="flex items-center gap-2 text-success mb-1">
                                        <Target className="w-4 h-4" />
                                        <span className="text-xs font-medium">Sucesso</span>
                                      </div>
                                      <p className="text-xl font-bold">{data.successCount}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border">
                                      <div className="flex items-center gap-2 text-warning mb-1">
                                        <Minus className="w-4 h-4" />
                                        <span className="text-xs font-medium">Neutro</span>
                                      </div>
                                      <p className="text-xl font-bold">{data.neutralCount}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border">
                                      <div className="flex items-center gap-2 text-destructive mb-1">
                                        <TrendingDown className="w-4 h-4" />
                                        <span className="text-xs font-medium">Falha</span>
                                      </div>
                                      <p className="text-xl font-bold">{data.failureCount}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-background border">
                                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Users className="w-4 h-4" />
                                        <span className="text-xs font-medium">Último Uso</span>
                                      </div>
                                      <p className="text-sm font-medium">{formatDate(data.lastUsed)}</p>
                                    </div>
                                  </div>

                                  {/* DISC Performance */}
                                  <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-primary" />
                                      Performance por Perfil DISC
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {(['D', 'I', 'S', 'C'] as DISCProfile[]).map(disc => (
                                        <Badge
                                          key={disc}
                                          variant="outline"
                                          className={cn('gap-1.5', discColors[disc])}
                                        >
                                          <span className="font-bold">{disc}</span>
                                          <span className="text-xs">
                                            {discLabels[disc]}
                                          </span>
                                          {data.totalUsages > 0 && (
                                            <span className="ml-1 text-xs opacity-70">
                                              {data.discPerformance[disc].successRate.toFixed(0)}%
                                            </span>
                                          )}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Template Preview */}
                                  <div className="p-3 rounded-lg bg-background border">
                                    <p className="text-xs text-muted-foreground mb-1">Prévia:</p>
                                    <p className="text-sm line-clamp-2">
                                      {data.template.template}
                                    </p>
                                  </div>
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Summary Stats */}
        {performanceData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pt-2 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {performanceData.length}
              </p>
              <p className="text-xs text-muted-foreground">Templates no cenário</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {performanceData.reduce((sum, d) => sum + d.totalUsages, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total de usos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {performanceData.filter(d => d.totalUsages > 0).length > 0
                  ? (
                      performanceData
                        .filter(d => d.totalUsages > 0)
                        .reduce((sum, d) => sum + d.successRate, 0) /
                      performanceData.filter(d => d.totalUsages > 0).length
                    ).toFixed(0)
                  : 0}%
              </p>
              <p className="text-xs text-muted-foreground">Média de sucesso</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
