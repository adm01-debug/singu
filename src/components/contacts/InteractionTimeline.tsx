import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, subDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Users, 
  Edit, 
  Star, 
  Filter,
  CalendarDays,
  Smile,
  Meh,
  Frown,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Sparkles,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Interaction, InteractionType, SentimentType } from '@/types';
import { cn } from '@/lib/utils';

interface InteractionTimelineProps {
  interactions: Interaction[];
  onAddInteraction?: () => void;
}

const interactionIcons: Record<InteractionType, typeof MessageSquare> = {
  whatsapp: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  note: Edit,
  social: Star,
};

const interactionLabels: Record<InteractionType, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'E-mail',
  meeting: 'Reunião',
  note: 'Nota',
  social: 'Social',
};

const interactionColors: Record<InteractionType, { bg: string; text: string; border: string }> = {
  whatsapp: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  call: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30' },
  email: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30' },
  meeting: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  note: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  social: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/30' },
};

const periodOptions = [
  { value: 'all', label: 'Todo o período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '1y', label: 'Último ano' },
];

const sentimentOptions: { value: SentimentType | 'all'; label: string; icon: typeof Smile }[] = [
  { value: 'all', label: 'Todos', icon: Smile },
  { value: 'positive', label: 'Positivo', icon: Smile },
  { value: 'neutral', label: 'Neutro', icon: Meh },
  { value: 'negative', label: 'Negativo', icon: Frown },
];

type PeriodFilter = 'all' | '7d' | '30d' | '90d' | '6m' | '1y';

export function InteractionTimeline({ interactions, onAddInteraction }: InteractionTimelineProps) {
  const [selectedTypes, setSelectedTypes] = useState<InteractionType[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [selectedSentiment, setSelectedSentiment] = useState<SentimentType | 'all'>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length > 0) count++;
    if (selectedPeriod !== 'all') count++;
    if (selectedSentiment !== 'all') count++;
    return count;
  }, [selectedTypes, selectedPeriod, selectedSentiment]);

  const filteredInteractions = useMemo(() => {
    let result = [...interactions];

    // Filter by type
    if (selectedTypes.length > 0) {
      result = result.filter(i => selectedTypes.includes(i.type));
    }

    // Filter by period
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (selectedPeriod) {
        case '7d':
          startDate = subDays(now, 7);
          break;
        case '30d':
          startDate = subDays(now, 30);
          break;
        case '90d':
          startDate = subDays(now, 90);
          break;
        case '6m':
          startDate = subDays(now, 180);
          break;
        case '1y':
          startDate = subDays(now, 365);
          break;
        default:
          startDate = new Date(0);
      }
      
      result = result.filter(i => isAfter(new Date(i.createdAt), startDate));
    }

    // Filter by sentiment
    if (selectedSentiment !== 'all') {
      result = result.filter(i => i.sentiment === selectedSentiment);
    }

    // Sort by date descending
    return result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [interactions, selectedTypes, selectedPeriod, selectedSentiment]);

  // Group interactions by date
  const groupedInteractions = useMemo(() => {
    const groups: { date: string; interactions: Interaction[] }[] = [];
    
    filteredInteractions.forEach(interaction => {
      const dateStr = format(new Date(interaction.createdAt), 'yyyy-MM-dd');
      const existingGroup = groups.find(g => g.date === dateStr);
      
      if (existingGroup) {
        existingGroup.interactions.push(interaction);
      } else {
        groups.push({ date: dateStr, interactions: [interaction] });
      }
    });
    
    return groups;
  }, [filteredInteractions]);

  const toggleTypeFilter = (type: InteractionType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedPeriod('all');
    setSelectedSentiment('all');
  };

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    const bySentiment: Record<string, number> = {};
    
    filteredInteractions.forEach(i => {
      byType[i.type] = (byType[i.type] || 0) + 1;
      bySentiment[i.sentiment] = (bySentiment[i.sentiment] || 0) + 1;
    });
    
    return { byType, bySentiment };
  }, [filteredInteractions]);

  const formatGroupDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const interactionDate = startOfDay(date);
    
    if (interactionDate.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (interactionDate.getTime() === yesterday.getTime()) {
      return 'Ontem';
    } else {
      return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros</h4>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                      Limpar todos
                    </Button>
                  )}
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Tipo de Interação
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(interactionIcons) as InteractionType[]).map(type => {
                      const Icon = interactionIcons[type];
                      const isSelected = selectedTypes.includes(type);
                      const colors = interactionColors[type];
                      
                      return (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTypeFilter(type)}
                          className={cn(
                            'gap-1.5 h-8',
                            isSelected && `${colors.bg} ${colors.text} ${colors.border}`
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {interactionLabels[type]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Period Filter */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Período
                  </label>
                  <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as PeriodFilter)}>
                    <SelectTrigger className="w-full">
                      <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sentiment Filter */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Sentimento
                  </label>
                  <div className="flex gap-2">
                    {sentimentOptions.map(option => {
                      const Icon = option.icon;
                      const isSelected = selectedSentiment === option.value;
                      
                      return (
                        <Button
                          key={option.value}
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSentiment(option.value)}
                          className={cn(
                            'gap-1.5 flex-1 h-8',
                            isSelected && 'border-primary bg-primary/10 text-primary'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter badges */}
          <AnimatePresence mode="popLayout">
            {selectedTypes.map(type => (
              <motion.div
                key={type}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge 
                  variant="secondary" 
                  className={cn('gap-1 cursor-pointer', interactionColors[type].text)}
                  onClick={() => toggleTypeFilter(type)}
                >
                  {interactionLabels[type]}
                  <X className="w-3 h-3" />
                </Badge>
              </motion.div>
            ))}
            {selectedPeriod !== 'all' && (
              <motion.div
                key="period"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge 
                  variant="secondary" 
                  className="gap-1 cursor-pointer"
                  onClick={() => setSelectedPeriod('all')}
                >
                  {periodOptions.find(p => p.value === selectedPeriod)?.label}
                  <X className="w-3 h-3" />
                </Badge>
              </motion.div>
            )}
            {selectedSentiment !== 'all' && (
              <motion.div
                key="sentiment"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge 
                  variant="secondary" 
                  className="gap-1 cursor-pointer"
                  onClick={() => setSelectedSentiment('all')}
                >
                  {sentimentOptions.find(s => s.value === selectedSentiment)?.label}
                  <X className="w-3 h-3" />
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button onClick={onAddInteraction} className="gap-2">
          <Plus className="w-4 h-4" />
          Registrar Interação
        </Button>
      </div>

      {/* Stats summary */}
      {filteredInteractions.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground">
            {filteredInteractions.length} interação{filteredInteractions.length !== 1 ? 'ões' : ''}
          </span>
          <div className="flex items-center gap-2">
            {stats.bySentiment.positive > 0 && (
              <div className="flex items-center gap-1">
                <Smile className="w-4 h-4 text-success" />
                <span>{stats.bySentiment.positive}</span>
              </div>
            )}
            {stats.bySentiment.neutral > 0 && (
              <div className="flex items-center gap-1">
                <Meh className="w-4 h-4 text-warning" />
                <span>{stats.bySentiment.neutral}</span>
              </div>
            )}
            {stats.bySentiment.negative > 0 && (
              <div className="flex items-center gap-1">
                <Frown className="w-4 h-4 text-destructive" />
                <span>{stats.bySentiment.negative}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative">
        {groupedInteractions.length > 0 && (
          <div className="absolute left-[27px] top-8 bottom-8 w-0.5 bg-border" />
        )}

        <AnimatePresence mode="popLayout">
          {groupedInteractions.map((group, groupIndex) => (
            <motion.div
              key={group.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.05 }}
              className="mb-6"
            >
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center z-10">
                  <CalendarDays className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground capitalize">
                    {formatGroupDate(group.date)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {group.interactions.length} interação{group.interactions.length !== 1 ? 'ões' : ''}
                  </p>
                </div>
              </div>

              {/* Interactions for this date */}
              <div className="ml-7 pl-10 border-l-2 border-transparent space-y-3">
                {group.interactions.map((interaction, index) => {
                  const Icon = interactionIcons[interaction.type];
                  const colors = interactionColors[interaction.type];

                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Card className={cn('card-hover relative overflow-hidden', colors.border, 'border-l-4')}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={cn('p-2.5 rounded-xl shrink-0', colors.bg)}>
                              <Icon className={cn('w-5 h-5', colors.text)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium text-foreground">{interaction.title}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      'text-xs gap-1',
                                      interaction.initiatedBy === 'them' 
                                        ? 'bg-primary/10 text-primary border-primary/30' 
                                        : 'bg-muted'
                                    )}
                                  >
                                    {interaction.initiatedBy === 'them' ? (
                                      <>
                                        <ArrowDownLeft className="w-3 h-3" />
                                        Recebido
                                      </>
                                    ) : (
                                      <>
                                        <ArrowUpRight className="w-3 h-3" />
                                        Enviado
                                      </>
                                    )}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <SentimentIndicator sentiment={interaction.sentiment} size="sm" />
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(interaction.createdAt), 'HH:mm', { locale: ptBR })}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {interaction.content}
                              </p>

                              {/* Key Insights */}
                              {interaction.keyInsights && interaction.keyInsights.length > 0 && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-3 p-2.5 rounded-lg bg-warning/10 border border-warning/20"
                                >
                                  <p className="text-xs font-medium text-warning mb-1.5 flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Insights capturados
                                  </p>
                                  <ul className="text-xs text-foreground space-y-0.5">
                                    {interaction.keyInsights.map((insight, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <span className="text-warning">•</span>
                                        {insight}
                                      </li>
                                    ))}
                                  </ul>
                                </motion.div>
                              )}

                              {/* Follow-up indicator */}
                              {interaction.followUpRequired && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs text-warning">
                                  <Clock className="w-3.5 h-3.5" />
                                  Follow-up necessário
                                  {interaction.followUpDate && (
                                    <span className="text-muted-foreground">
                                      • {format(new Date(interaction.followUpDate), "d 'de' MMM", { locale: ptBR })}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Tags */}
                              {interaction.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {interaction.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {filteredInteractions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">
              {activeFiltersCount > 0 ? 'Nenhuma interação encontrada' : 'Nenhuma interação ainda'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeFiltersCount > 0 
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'Registre sua primeira interação com este contato'
              }
            </p>
            {activeFiltersCount > 0 ? (
              <Button variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={onAddInteraction} className="gap-2">
                <Plus className="w-4 h-4" />
                Registrar Interação
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
