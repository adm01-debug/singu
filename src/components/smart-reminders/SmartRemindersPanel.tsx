import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  Cake, 
  Thermometer, 
  Star, 
  X, 
  Clock, 
  ChevronRight,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSmartReminders, SmartReminder } from '@/hooks/useSmartReminders';
import { useCelebration } from '@/components/celebrations/CelebrationProvider';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SmartRemindersPanelProps {
  className?: string;
  compact?: boolean;
}

const typeIcons = {
  follow_up: Calendar,
  birthday: Cake,
  decay: Thermometer,
  milestone: Star
};

const typeLabels = {
  follow_up: 'Follow-up',
  birthday: 'Aniversário',
  decay: 'Esfriando',
  milestone: 'Marco'
};

const typeColors = {
  follow_up: 'text-info bg-info/10',
  birthday: 'text-warning bg-warning/10',
  decay: 'text-destructive bg-destructive/10',
  milestone: 'text-success bg-success/10'
};

const priorityColors = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-success bg-success/5'
};

const priorityBadgeColors = {
  high: 'bg-destructive/10 text-destructive border-destructive/30',
  medium: 'bg-warning/10 text-warning border-warning/30',
  low: 'bg-success/10 text-success border-success/30'
};

export const SmartRemindersPanel = ({ className, compact = false }: SmartRemindersPanelProps) => {
  const navigate = useNavigate();
  const { celebrate } = useCelebration();
  const {
    reminders,
    summary,
    aiInsights,
    isLoading,
    fetchReminders,
    dismissReminder,
    snoozeReminder,
    completeReminder
  } = useSmartReminders();

  const [activeTab, setActiveTab] = useState('all');
  const [showInsights, setShowInsights] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReminders = activeTab === 'all' 
    ? reminders 
    : reminders.filter(r => r.type === activeTab);

  const handleContactClick = (contactId: string) => {
    navigate(`/contatos/${contactId}`);
  };

  const handleComplete = (reminder: SmartReminder) => {
    completeReminder(reminder);
    
    // Trigger appropriate celebration based on type
    const celebrationConfig = {
      follow_up: {
        type: 'follow-up-complete' as const,
        title: 'Follow-up Concluído! 🎉',
        subtitle: `Ótimo trabalho com ${reminder.contactName}!`,
      },
      birthday: {
        type: 'birthday-wished' as const,
        title: 'Parabéns Enviados! 🎂',
        subtitle: `${reminder.contactName} vai adorar sua mensagem!`,
      },
      decay: {
        type: 'relationship-milestone' as const,
        title: 'Relacionamento Reativado! 💝',
        subtitle: `Você reconectou com ${reminder.contactName}!`,
      },
      milestone: {
        type: 'goal-achieved' as const,
        title: 'Marco Alcançado! 🎯',
        subtitle: `Celebre este momento com ${reminder.contactName}!`,
      },
    };

    const config = celebrationConfig[reminder.type];
    celebrate({
      ...config,
      duration: 3000,
    });
  };

  const renderReminder = (reminder: SmartReminder, index: number) => {
    const Icon = typeIcons[reminder.type];
    const isExpanded = expandedId === reminder.id;

    return (
      <motion.div
        key={reminder.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ delay: index * 0.05 }}
        layout
      >
        <Card 
          className={cn(
            'border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden',
            priorityColors[reminder.priority]
          )}
          onClick={() => setExpandedId(isExpanded ? null : reminder.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-lg shrink-0', typeColors[reminder.type])}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm line-clamp-1">
                      {reminder.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {reminder.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px] px-1.5 py-0', priorityBadgeColors[reminder.priority])}
                    >
                      {reminder.priority === 'high' ? 'Urgente' : 
                       reminder.priority === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
                        {reminder.dueDate && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(reminder.dueDate).toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          </div>
                        )}

                        {reminder.type === 'decay' && reminder.metadata && (
                          <div className="flex items-center gap-2 text-xs">
                            <Thermometer className="w-3 h-3 text-destructive" />
                            <span className="text-muted-foreground">
                              {String(reminder.metadata.daysSinceLastInteraction)} dias sem contato
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Score: {String(reminder.metadata.relationshipScore)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs bg-success hover:bg-success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComplete(reminder);
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Concluir
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactClick(reminder.contactId);
                            }}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Ver Contato
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Adiar
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => snoozeReminder(reminder.id, 1)}>
                                1 hora
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => snoozeReminder(reminder.id, 4)}>
                                4 horas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => snoozeReminder(reminder.id, 24)}>
                                Amanhã
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissReminder(reminder.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isExpanded && (
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactClick(reminder.contactId);
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {reminder.contactName}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    
                    {reminder.dueDate && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(reminder.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (compact) {
    // Compact version for dashboard
    const highPriorityReminders = reminders.filter(r => r.priority === 'high').slice(0, 3);
    
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Lembretes
              {summary && summary.byPriority.high > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {summary.byPriority.high}
                </Badge>
              )}
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/notificacoes')}
              className="text-xs"
            >
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : highPriorityReminders.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {highPriorityReminders.map((reminder, index) => renderReminder(reminder, index))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum lembrete urgente</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Smart Reminders
                {summary && summary.total > 0 && (
                  <Badge variant="secondary">
                    {summary.total}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Lembretes inteligentes para seus relacionamentos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => fetchReminders(true)}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar com insights IA</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="p-2 rounded-lg bg-info/10 text-center">
              <p className="text-lg font-bold text-info">{summary.byType.follow_up}</p>
              <p className="text-[10px] text-muted-foreground">Follow-ups</p>
            </div>
            <div className="p-2 rounded-lg bg-warning/10 text-center">
              <p className="text-lg font-bold text-warning">{summary.byType.birthday}</p>
              <p className="text-[10px] text-muted-foreground">Aniversários</p>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10 text-center">
              <p className="text-lg font-bold text-destructive">{summary.byType.decay}</p>
              <p className="text-[10px] text-muted-foreground">Esfriando</p>
            </div>
            <div className="p-2 rounded-lg bg-success/10 text-center">
              <p className="text-lg font-bold text-success">{summary.byType.milestone}</p>
              <p className="text-[10px] text-muted-foreground">Marcos</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Insights */}
        <AnimatePresence>
          {aiInsights && showInsights && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-foreground mb-1">
                          Insights da IA
                        </h4>
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {aiInsights}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => setShowInsights(false)}
                    >
                      <EyeOff className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!showInsights && aiInsights && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInsights(true)}
            className="text-xs text-muted-foreground"
          >
            <Eye className="w-3 h-3 mr-1" />
            Mostrar insights IA
          </Button>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 h-9">
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="follow_up" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Follow-up
            </TabsTrigger>
            <TabsTrigger value="birthday" className="text-xs">
              <Cake className="w-3 h-3 mr-1" />
              Aniversário
            </TabsTrigger>
            <TabsTrigger value="decay" className="text-xs">
              <Thermometer className="w-3 h-3 mr-1" />
              Esfriando
            </TabsTrigger>
            <TabsTrigger value="milestone" className="text-xs">
              <Star className="w-3 h-3 mr-1" />
              Marcos
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredReminders.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredReminders.map((reminder, index) => renderReminder(reminder, index))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 bg-muted/50 rounded-full mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-foreground mb-1">Tudo em dia!</h4>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {activeTab === 'all' 
                      ? 'Não há lembretes pendentes no momento.' 
                      : `Não há lembretes de ${typeLabels[activeTab as keyof typeof typeLabels]} pendentes.`}
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* High priority warning */}
        {summary && summary.byPriority.high > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30"
          >
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">
              Você tem {summary.byPriority.high} lembrete{summary.byPriority.high > 1 ? 's' : ''} urgente{summary.byPriority.high > 1 ? 's' : ''} que precisa{summary.byPriority.high > 1 ? 'm' : ''} de atenção.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};