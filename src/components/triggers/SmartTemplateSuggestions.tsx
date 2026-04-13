import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Star, Target, ChevronRight, Zap, Award, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTriggerHistory } from '@/hooks/useTriggerHistory';
import { useClientTriggers } from '@/hooks/useClientTriggers';
import { PersuasionTemplate, MENTAL_TRIGGERS, TriggerType, PersuasionScenario } from '@/types/triggers';
import { logger } from "@/lib/logger";
import { TemplatePreviewDialog } from './smart-template/TemplatePreviewDialog';

interface SmartTemplateSuggestionsProps {
  contact: Contact;
  className?: string;
  onSelectTemplate?: (template: PersuasionTemplate) => void;
}

type DISCProfile = 'D' | 'I' | 'S' | 'C';

interface TemplateSuccessData {
  templateId: string;
  templateTitle: string;
  triggerType: TriggerType;
  scenario: PersuasionScenario | null;
  totalUsages: number;
  successCount: number;
  successRate: number;
  avgRating: number;
  discPerformance: Record<DISCProfile, { usages: number; successRate: number }>;
}

interface SmartSuggestion {
  template: PersuasionTemplate;
  reason: string;
  score: number;
  successData: TemplateSuccessData | null;
  isPersonalized: boolean;
  tag: 'top_performer' | 'disc_match' | 'rising_star' | 'recommended';
}

const TAG_CONFIG = {
  top_performer: { label: 'Top Performer', icon: Award, color: 'bg-warning/10 text-warning border-warning/30' },
  disc_match: { label: 'Match DISC', icon: Users, color: 'bg-info/10 text-info border-info' },
  rising_star: { label: 'Em Alta', icon: TrendingUp, color: 'bg-success/10 text-success border-success/30' },
  recommended: { label: 'Recomendado', icon: Sparkles, color: 'bg-primary/10 text-primary border-primary/30' },
};

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp', email: 'E-mail', call: 'Ligação', meeting: 'Reunião', any: 'Universal',
};

export function SmartTemplateSuggestions({ contact, className, onSelectTemplate }: SmartTemplateSuggestionsProps) {
  const { user } = useAuth();
  const { allTemplates, analysis } = useClientTriggers(contact);
  const { createUsage } = useTriggerHistory(contact.id);
  const [loading, setLoading] = useState(true);
  const [templateStats, setTemplateStats] = useState<Map<string, TemplateSuccessData>>(new Map());
  
  const contactDISC = contact.behavior?.discProfile as DISCProfile | undefined;
  
  useEffect(() => { fetchTemplateStats(); }, [user]);
  
  const fetchTemplateStats = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: usageHistory, error } = await supabase
        .from('trigger_usage_history')
        .select('id, trigger_type, template_id, template_title, scenario, result, effectiveness_rating, contact_id')
        .eq('user_id', user.id);
      if (error) throw error;
      
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts').select('id, behavior').eq('user_id', user.id);
      if (contactsError) throw contactsError;
      
      const contactDISCMap = new Map<string, DISCProfile | null>();
      contacts?.forEach((c) => {
        const behavior = c.behavior as { discProfile?: string } | null;
        contactDISCMap.set(c.id, (behavior?.discProfile as DISCProfile) || null);
      });
      
      const statsMap = new Map<string, TemplateSuccessData>();
      usageHistory?.forEach((usage) => {
        if (!usage.template_id) return;
        const existing = statsMap.get(usage.template_id);
        const usageDISC = contactDISCMap.get(usage.contact_id);
        
        if (!existing) {
          statsMap.set(usage.template_id, {
            templateId: usage.template_id, templateTitle: usage.template_title || '',
            triggerType: usage.trigger_type as TriggerType, scenario: usage.scenario as PersuasionScenario | null,
            totalUsages: 1, successCount: usage.result === 'success' ? 1 : 0, successRate: 0,
            avgRating: usage.effectiveness_rating || 0,
            discPerformance: { D: { usages: 0, successRate: 0 }, I: { usages: 0, successRate: 0 }, S: { usages: 0, successRate: 0 }, C: { usages: 0, successRate: 0 } },
          });
          if (usageDISC) {
            statsMap.get(usage.template_id)!.discPerformance[usageDISC].usages = 1;
            if (usage.result === 'success') statsMap.get(usage.template_id)!.discPerformance[usageDISC].successRate = 100;
          }
        } else {
          existing.totalUsages++;
          if (usage.result === 'success') existing.successCount++;
          if (usage.effectiveness_rating) existing.avgRating = (existing.avgRating * (existing.totalUsages - 1) + usage.effectiveness_rating) / existing.totalUsages;
          if (usageDISC) {
            const discStats = existing.discPerformance[usageDISC];
            const prevSuccesses = Math.round(discStats.usages * discStats.successRate / 100);
            discStats.usages++;
            discStats.successRate = ((prevSuccesses + (usage.result === 'success' ? 1 : 0)) / discStats.usages) * 100;
          }
        }
      });
      
      statsMap.forEach((stat) => { stat.successRate = stat.totalUsages > 0 ? (stat.successCount / stat.totalUsages) * 100 : 0; });
      setTemplateStats(statsMap);
    } catch (error) { logger.error('Error fetching template stats:', error); }
    finally { setLoading(false); }
  };
  
  const suggestions = useMemo<SmartSuggestion[]>(() => {
    if (!allTemplates.length) return [];
    const scored: SmartSuggestion[] = [];
    
    allTemplates.forEach((template) => {
      if (template.discProfile && template.discProfile !== contactDISC) return;
      const stats = templateStats.get(template.id);
      const trigger = MENTAL_TRIGGERS[template.trigger as TriggerType];
      const triggerSuggestion = analysis?.primaryTriggers.find(t => t.trigger.id === template.trigger);
      
      let score = 0; let reason = ''; let tag: SmartSuggestion['tag'] = 'recommended'; let isPersonalized = false;
      
      if (stats && stats.totalUsages >= 2) {
        score += Math.min(40, stats.successRate * 0.4);
        if (stats.successRate >= 70 && stats.totalUsages >= 3) { tag = 'top_performer'; reason = `Taxa de sucesso de ${stats.successRate.toFixed(0)}% em ${stats.totalUsages} usos`; }
      }
      if (stats && contactDISC && stats.discPerformance[contactDISC].usages >= 2) {
        const discRate = stats.discPerformance[contactDISC].successRate;
        score += Math.min(30, discRate * 0.3); isPersonalized = true;
        if (discRate > stats.successRate && discRate >= 60) { tag = 'disc_match'; reason = `${discRate.toFixed(0)}% de sucesso com perfil ${contactDISC}`; }
      }
      if (triggerSuggestion) { score += Math.min(20, triggerSuggestion.matchScore * 0.2); if (!reason) reason = triggerSuggestion.reason; }
      if (stats && stats.avgRating > 0) score += stats.avgRating * 2;
      if (stats && stats.totalUsages >= 3 && stats.successRate >= 50 && tag === 'recommended') { tag = 'rising_star'; reason = reason || 'Template em crescimento com bons resultados'; }
      if (score < 10 && !stats) { score = 10 + (triggerSuggestion?.matchScore || 0) * 0.1; reason = reason || `Recomendado para ${trigger?.name || template.trigger}`; }
      
      scored.push({ template, reason: reason || `Sugerido baseado no perfil ${contactDISC || 'do contato'}`, score, successData: stats || null, isPersonalized, tag });
    });
    
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [allTemplates, templateStats, contactDISC, analysis]);
  
  const handleUseTemplate = async (template: PersuasionTemplate) => {
    await createUsage({ contact_id: contact.id, trigger_type: template.trigger as TriggerType, template_id: template.id, template_title: template.title, scenario: template.scenario as PersuasionScenario, channel: template.channel, result: 'pending' });
    onSelectTemplate?.(template);
  };
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3"><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</CardContent>
      </Card>
    );
  }
  
  if (suggestions.length === 0) return null;
  
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          Sugestões Inteligentes
          <Badge variant="secondary" className="ml-auto text-xs">Baseado no histórico</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-2">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {suggestions.map((suggestion, index) => {
                const { template, reason, score, successData, tag } = suggestion;
                const trigger = MENTAL_TRIGGERS[template.trigger as TriggerType];
                const TagIcon = TAG_CONFIG[tag].icon;
                
                return (
                  <motion.div key={template.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.1 }}>
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">{index + 1}</div>
                          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0', trigger?.color)}>{trigger?.icon || '🎯'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium truncate">{template.title}</p>
                              <Badge variant="outline" className={cn('text-xs gap-1', TAG_CONFIG[tag].color)}>
                                <TagIcon className="w-3 h-3" />{TAG_CONFIG[tag].label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{reason}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {successData && successData.totalUsages > 0 && (
                                <span className="text-xs text-success flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />{successData.successRate.toFixed(0)}%
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">{channelLabels[template.channel] || template.channel}</Badge>
                              <span className="text-xs text-muted-foreground">Score: {score.toFixed(0)}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <span className="text-lg">{trigger?.icon}</span>{template.title}
                          </DialogTitle>
                        </DialogHeader>
                        <TemplatePreviewDialog suggestion={suggestion} contact={contact} onUse={handleUseTemplate} />
                      </DialogContent>
                    </Dialog>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
