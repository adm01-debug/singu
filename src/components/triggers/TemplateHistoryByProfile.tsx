import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target,
  Sparkles,
  Filter,
  Eye,
  Palette,
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
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DISCProfile } from '@/types';
import { MENTAL_TRIGGERS } from '@/types/triggers';
import { useTriggerHistory, TriggerUsageEntry } from '@/hooks/useTriggerHistory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from "@/lib/logger";

interface TemplateHistoryByProfileProps {
  className?: string;
}

interface ContactDISCInfo {
  contactId: string;
  contactName: string;
  discProfile: DISCProfile;
}

interface ProfileMetrics {
  profile: DISCProfile;
  totalUsages: number;
  successCount: number;
  successRate: number;
  avgRating: number;
  topTemplates: {
    templateId: string;
    templateTitle: string;
    triggerType: string;
    usages: number;
    successRate: number;
    avgRating: number;
  }[];
  trend: 'up' | 'down' | 'stable';
  recentUsages: TriggerUsageEntry[];
}

interface TemplateProfileMetrics {
  templateId: string;
  templateTitle: string;
  triggerType: string;
  byProfile: Record<DISCProfile, {
    usages: number;
    successCount: number;
    successRate: number;
    avgRating: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  totalUsages: number;
  overallSuccessRate: number;
  bestProfile: DISCProfile | null;
  worstProfile: DISCProfile | null;
}

const DISC_CONFIG: Record<DISCProfile, { label: string; color: string; bgColor: string; description: string }> = {
  D: {
    label: 'Dominante',
    color: 'text-destructive',
    bgColor: 'bg-destructive dark:bg-destructive/30',
    description: 'Direto, decisivo, focado em resultados',
  },
  I: {
    label: 'Influente',
    color: 'text-warning',
    bgColor: 'bg-warning dark:bg-warning/30',
    description: 'Entusiasta, persuasivo, otimista',
  },
  S: {
    label: 'Estável',
    color: 'text-success',
    bgColor: 'bg-success dark:bg-success/30',
    description: 'Paciente, confiável, trabalha em equipe',
  },
  C: {
    label: 'Analítico',
    color: 'text-info',
    bgColor: 'bg-info dark:bg-info/30',
    description: 'Preciso, analítico, focado em qualidade',
  },
};

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function ProfileCard({ metrics, isExpanded, onToggle }: {
  metrics: ProfileMetrics;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = DISC_CONFIG[metrics.profile];

  return (
    <motion.div
      layout
      className={cn(
        'border rounded-xl overflow-hidden transition-shadow',
        isExpanded && 'shadow-md'
      )}
    >
      <div
        className={cn(
          'p-4 cursor-pointer hover:bg-muted/30 transition-colors',
          config.bgColor
        )}
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold',
              'bg-background border-2',
              config.color
            )}>
              {metrics.profile}
            </div>
            <div>
              <h4 className={cn('font-semibold', config.color)}>
                {config.label}
              </h4>
              <p className="text-xs text-muted-foreground">
                {metrics.totalUsages} templates usados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <span className={cn(
                  'text-lg font-bold',
                  metrics.successRate >= 70 ? 'text-success' :
                  metrics.successRate >= 40 ? 'text-warning' : 'text-destructive'
                )}>
                  {metrics.successRate.toFixed(0)}%
                </span>
                <TrendIcon trend={metrics.trend} />
              </div>
              <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-background border-t space-y-4">
              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-success">{metrics.successCount}</p>
                  <p className="text-xs text-muted-foreground">Sucessos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <p className="text-2xl font-bold">{metrics.avgRating.toFixed(1)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Média</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{metrics.totalUsages}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>

              {/* Top Templates */}
              {metrics.topTemplates.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Templates Mais Efetivos
                  </h5>
                  <div className="space-y-2">
                    {metrics.topTemplates.slice(0, 3).map((template, idx) => {
                      const trigger = MENTAL_TRIGGERS[template.triggerType as keyof typeof MENTAL_TRIGGERS];
                      return (
                        <div
                          key={template.templateId}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              #{idx + 1}
                            </span>
                            <span>{trigger?.icon}</span>
                            <span className="text-sm font-medium truncate max-w-[180px]">
                              {template.templateTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.usages}x
                            </Badge>
                            <span className={cn(
                              'text-sm font-semibold',
                              template.successRate >= 70 ? 'text-success' : 'text-warning'
                            )}>
                              {template.successRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Usages */}
              {metrics.recentUsages.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Uso Recente
                  </h5>
                  <div className="space-y-1.5">
                    {metrics.recentUsages.slice(0, 3).map((usage) => {
                      const trigger = MENTAL_TRIGGERS[usage.trigger_type as keyof typeof MENTAL_TRIGGERS];
                      return (
                        <div
                          key={usage.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span>{trigger?.icon}</span>
                            <span className="text-muted-foreground truncate max-w-[150px]">
                              {usage.template_title || trigger?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                usage.result === 'success' && 'border-success text-success',
                                usage.result === 'failure' && 'border-destructive text-destructive'
                              )}
                            >
                              {usage.result === 'success' ? 'Sucesso' :
                               usage.result === 'failure' ? 'Falhou' :
                               usage.result === 'neutral' ? 'Neutro' : 'Pendente'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(usage.used_at), 'd MMM', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TemplateByProfileView({ templateMetrics }: { templateMetrics: TemplateProfileMetrics[] }) {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  if (templateMetrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          Nenhum dado de template encontrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templateMetrics.map((tm) => {
        const trigger = MENTAL_TRIGGERS[tm.triggerType as keyof typeof MENTAL_TRIGGERS];
        const isExpanded = expandedTemplate === tm.templateId;

        return (
          <motion.div
            key={tm.templateId}
            layout
            className="border rounded-lg overflow-hidden"
          >
            <div
              className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedTemplate(isExpanded ? null : tm.templateId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{trigger?.icon}</span>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">
                      {tm.templateTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">{trigger?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {tm.bestProfile && (
                    <Badge className={cn(
                      'text-xs',
                      DISC_CONFIG[tm.bestProfile].bgColor,
                      DISC_CONFIG[tm.bestProfile].color
                    )}>
                      Melhor: {tm.bestProfile}
                    </Badge>
                  )}
                  <div className="text-right">
                    <p className={cn(
                      'font-semibold',
                      tm.overallSuccessRate >= 70 ? 'text-success' :
                      tm.overallSuccessRate >= 40 ? 'text-warning' : 'text-muted-foreground'
                    )}>
                      {tm.overallSuccessRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{tm.totalUsages} usos</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 border-t bg-muted/20">
                    <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Performance por Perfil DISC
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((profile) => {
                        const data = tm.byProfile[profile];
                        const config = DISC_CONFIG[profile];
                        const isBest = tm.bestProfile === profile;
                        const isWorst = tm.worstProfile === profile;

                        return (
                          <div
                            key={profile}
                            className={cn(
                              'p-3 rounded-lg border',
                              config.bgColor,
                              isBest && 'ring-2 ring-success',
                              isWorst && data.usages > 0 && 'ring-2 ring-destructive'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={cn('font-bold text-lg', config.color)}>
                                  {profile}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {config.label}
                                </span>
                              </div>
                              {isBest && (
                                <Badge variant="outline" className="text-xs border-success text-success">
                                  Melhor
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Usos</span>
                                <span className="font-medium">{data.usages}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sucesso</span>
                                <span className={cn(
                                  'font-medium',
                                  data.successRate >= 70 ? 'text-success' :
                                  data.successRate >= 40 ? 'text-warning' : 'text-destructive'
                                )}>
                                  {data.usages > 0 ? `${data.successRate.toFixed(0)}%` : '-'}
                                </span>
                              </div>
                              {data.avgRating > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Avaliação</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-warning fill-warning" />
                                    <span className="font-medium">{data.avgRating.toFixed(1)}</span>
                                  </div>
                                </div>
                              )}
                              {data.usages > 0 && (
                                <Progress
                                  value={data.successRate}
                                  className="h-1.5 mt-1"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

export function TemplateHistoryByProfile({ className }: TemplateHistoryByProfileProps) {
  const { user } = useAuth();
  const { history, loading: historyLoading } = useTriggerHistory();
  const [contactDISCMap, setContactDISCMap] = useState<Map<string, ContactDISCInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedProfile, setExpandedProfile] = useState<DISCProfile | null>(null);
  const [viewMode, setViewMode] = useState<'by-profile' | 'by-template'>('by-profile');

  // Fetch contact DISC profiles
  useEffect(() => {
    async function fetchContactDISC() {
      if (!user) return;
      
      try {
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, behavior')
          .eq('user_id', user.id);

        if (error) throw error;

        const discMap = new Map<string, ContactDISCInfo>();
        contacts?.forEach((contact) => {
          const behavior = contact.behavior as { disc_profile?: DISCProfile } | null;
          if (behavior?.disc_profile) {
            discMap.set(contact.id, {
              contactId: contact.id,
              contactName: `${contact.first_name} ${contact.last_name}`,
              discProfile: behavior.disc_profile,
            });
          }
        });
        setContactDISCMap(discMap);
      } catch (error) {
        logger.error('Error fetching contact DISC profiles:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContactDISC();
  }, [user]);

  // Calculate metrics by profile
  const profileMetrics = useMemo(() => {
    const metrics: Record<DISCProfile, ProfileMetrics> = {
      D: {
        profile: 'D',
        totalUsages: 0,
        successCount: 0,
        successRate: 0,
        avgRating: 0,
        topTemplates: [],
        trend: 'stable',
        recentUsages: [],
      },
      I: {
        profile: 'I',
        totalUsages: 0,
        successCount: 0,
        successRate: 0,
        avgRating: 0,
        topTemplates: [],
        trend: 'stable',
        recentUsages: [],
      },
      S: {
        profile: 'S',
        totalUsages: 0,
        successCount: 0,
        successRate: 0,
        avgRating: 0,
        topTemplates: [],
        trend: 'stable',
        recentUsages: [],
      },
      C: {
        profile: 'C',
        totalUsages: 0,
        successCount: 0,
        successRate: 0,
        avgRating: 0,
        topTemplates: [],
        trend: 'stable',
        recentUsages: [],
      },
    };

    // Group usages by profile
    const usagesByProfile: Record<DISCProfile, TriggerUsageEntry[]> = {
      D: [],
      I: [],
      S: [],
      C: [],
    };

    history.forEach((entry) => {
      const contactInfo = contactDISCMap.get(entry.contact_id);
      if (contactInfo) {
        usagesByProfile[contactInfo.discProfile].push(entry);
      }
    });

    // Calculate metrics for each profile
    (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((profile) => {
      const usages = usagesByProfile[profile];
      const completedUsages = usages.filter(u => u.result !== 'pending');
      const successUsages = completedUsages.filter(u => u.result === 'success');
      const ratedUsages = usages.filter(u => u.effectiveness_rating !== null);

      metrics[profile].totalUsages = usages.length;
      metrics[profile].successCount = successUsages.length;
      metrics[profile].successRate = completedUsages.length > 0
        ? (successUsages.length / completedUsages.length) * 100
        : 0;
      metrics[profile].avgRating = ratedUsages.length > 0
        ? ratedUsages.reduce((sum, u) => sum + (u.effectiveness_rating || 0), 0) / ratedUsages.length
        : 0;

      // Recent usages
      metrics[profile].recentUsages = usages
        .sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime())
        .slice(0, 5);

      // Calculate trend
      const sortedUsages = [...completedUsages].sort(
        (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
      );
      const recentHalf = sortedUsages.slice(0, Math.ceil(sortedUsages.length / 2));
      const olderHalf = sortedUsages.slice(Math.ceil(sortedUsages.length / 2));
      
      const recentSuccessRate = recentHalf.length > 0
        ? (recentHalf.filter(u => u.result === 'success').length / recentHalf.length) * 100
        : 0;
      const olderSuccessRate = olderHalf.length > 0
        ? (olderHalf.filter(u => u.result === 'success').length / olderHalf.length) * 100
        : 0;

      if (recentSuccessRate > olderSuccessRate + 10) metrics[profile].trend = 'up';
      else if (recentSuccessRate < olderSuccessRate - 10) metrics[profile].trend = 'down';

      // Top templates
      const templateMap = new Map<string, {
        templateId: string;
        templateTitle: string;
        triggerType: string;
        usages: number;
        successCount: number;
        totalRating: number;
        ratedCount: number;
      }>();

      usages.forEach((usage) => {
        const key = usage.template_id || usage.trigger_type;
        const existing = templateMap.get(key) || {
          templateId: usage.template_id || '',
          templateTitle: usage.template_title || '',
          triggerType: usage.trigger_type,
          usages: 0,
          successCount: 0,
          totalRating: 0,
          ratedCount: 0,
        };

        existing.usages++;
        if (usage.result === 'success') existing.successCount++;
        if (usage.effectiveness_rating) {
          existing.totalRating += usage.effectiveness_rating;
          existing.ratedCount++;
        }

        templateMap.set(key, existing);
      });

      metrics[profile].topTemplates = Array.from(templateMap.values())
        .map((t) => ({
          ...t,
          successRate: t.usages > 0 ? (t.successCount / t.usages) * 100 : 0,
          avgRating: t.ratedCount > 0 ? t.totalRating / t.ratedCount : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate || b.usages - a.usages)
        .slice(0, 5);
    });

    return metrics;
  }, [history, contactDISCMap]);

  // Calculate template metrics by profile
  const templateMetrics = useMemo(() => {
    const templateMap = new Map<string, TemplateProfileMetrics>();

    history.forEach((entry) => {
      const contactInfo = contactDISCMap.get(entry.contact_id);
      if (!contactInfo) return;

      const key = entry.template_id || entry.trigger_type;
      const existing = templateMap.get(key) || {
        templateId: entry.template_id || '',
        templateTitle: entry.template_title || MENTAL_TRIGGERS[entry.trigger_type as keyof typeof MENTAL_TRIGGERS]?.name || entry.trigger_type,
        triggerType: entry.trigger_type,
        byProfile: {
          D: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
          I: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
          S: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
          C: { usages: 0, successCount: 0, successRate: 0, avgRating: 0, trend: 'stable' as const },
        },
        totalUsages: 0,
        overallSuccessRate: 0,
        bestProfile: null,
        worstProfile: null,
      };

      existing.totalUsages++;
      const profileData = existing.byProfile[contactInfo.discProfile];
      profileData.usages++;
      if (entry.result === 'success') profileData.successCount++;

      templateMap.set(key, existing);
    });

    // Calculate rates and determine best/worst profiles
    const result: TemplateProfileMetrics[] = [];
    templateMap.forEach((tm) => {
      let totalSuccess = 0;
      let totalCompleted = 0;
      let bestRate = -1;
      let worstRate = 101;

      (['D', 'I', 'S', 'C'] as DISCProfile[]).forEach((profile) => {
        const data = tm.byProfile[profile];
        if (data.usages > 0) {
          data.successRate = (data.successCount / data.usages) * 100;
          totalSuccess += data.successCount;
          totalCompleted += data.usages;

          if (data.successRate > bestRate) {
            bestRate = data.successRate;
            tm.bestProfile = profile;
          }
          if (data.successRate < worstRate) {
            worstRate = data.successRate;
            tm.worstProfile = profile;
          }
        }
      });

      tm.overallSuccessRate = totalCompleted > 0 ? (totalSuccess / totalCompleted) * 100 : 0;
      result.push(tm);
    });

    return result.sort((a, b) => b.totalUsages - a.totalUsages);
  }, [history, contactDISCMap]);

  const isLoading = loading || historyLoading;

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const hasData = history.some(h => contactDISCMap.has(h.contact_id));

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Histórico por Perfil
          </CardTitle>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="by-profile">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Por Perfil
                </div>
              </SelectItem>
              <SelectItem value="by-template">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Por Template
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          Métricas de sucesso de templates por perfil DISC
        </p>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Nenhum dado de histórico com perfil DISC
            </p>
            <p className="text-xs text-muted-foreground">
              Configure o perfil DISC dos seus contatos para ver métricas por perfil
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {viewMode === 'by-profile' ? (
              <div className="space-y-3">
                {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((profile) => (
                  <ProfileCard
                    key={profile}
                    metrics={profileMetrics[profile]}
                    isExpanded={expandedProfile === profile}
                    onToggle={() => setExpandedProfile(
                      expandedProfile === profile ? null : profile
                    )}
                  />
                ))}
              </div>
            ) : (
              <TemplateByProfileView templateMetrics={templateMetrics} />
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
