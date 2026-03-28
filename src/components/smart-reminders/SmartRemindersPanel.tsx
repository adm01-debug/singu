import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import {
  Bell,
  Calendar,
  Cake,
  Thermometer,
  Star,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { typeLabels } from './reminder-constants';
import { ReminderCard } from './ReminderCard';
import { AIInsightsSection } from './AIInsightsSection';
import { SummaryStats } from './SummaryStats';

interface SmartRemindersPanelProps {
  className?: string;
  compact?: boolean;
}

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

  const handleToggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleComplete = (reminder: SmartReminder) => {
    completeReminder(reminder);

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

  if (compact) {
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
              {highPriorityReminders.map((reminder, index) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  index={index}
                  isExpanded={expandedId === reminder.id}
                  onToggleExpand={handleToggleExpand}
                  onComplete={handleComplete}
                  onContactClick={handleContactClick}
                  onSnooze={snoozeReminder}
                  onDismiss={dismissReminder}
                />
              ))}
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
                    aria-label="Atualizar"
                  >
                    <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar com insights IA</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {summary && <SummaryStats summary={summary} />}
      </CardHeader>

      <CardContent className="space-y-4">
        <AIInsightsSection
          aiInsights={aiInsights}
          showInsights={showInsights}
          onToggleInsights={setShowInsights}
        />

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
                    {filteredReminders.map((reminder, index) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        index={index}
                        isExpanded={expandedId === reminder.id}
                        onToggleExpand={handleToggleExpand}
                        onComplete={handleComplete}
                        onContactClick={handleContactClick}
                        onSnooze={snoozeReminder}
                        onDismiss={dismissReminder}
                      />
                    ))}
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
            className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/30"
          >
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600">
              Você tem {summary.byPriority.high} lembrete{summary.byPriority.high > 1 ? 's' : ''} urgente{summary.byPriority.high > 1 ? 's' : ''} que precisa{summary.byPriority.high > 1 ? 'm' : ''} de atenção.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
