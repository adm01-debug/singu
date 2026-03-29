import { useState, useEffect, useMemo } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare,
  Video,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCelebration } from '@/components/celebrations/CelebrationProvider';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

type Interaction = Tables<'interactions'>;
type Contact = Tables<'contacts'>;
type Company = Tables<'companies'>;

interface FollowUp extends Interaction {
  contact?: Contact | null;
  company?: Company | null;
}

const interactionTypeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  meeting: <Users className="w-4 h-4" />,
  video_call: <Video className="w-4 h-4" />,
  whatsapp: <MessageSquare className="w-4 h-4" />,
  other: <MessageSquare className="w-4 h-4" />,
};

const interactionTypeLabels: Record<string, string> = {
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  video_call: 'Videochamada',
  whatsapp: 'WhatsApp',
  other: 'Outro',
};

const Calendario = () => {
  const { user } = useAuth();
  const { celebrate } = useCelebration();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch follow-ups (interactions with follow_up_required = true)
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('interactions')
        .select('*')
        .eq('follow_up_required', true)
        .not('follow_up_date', 'is', null)
        .order('follow_up_date', { ascending: true });

      if (interactionsError) throw interactionsError;

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*');

      if (contactsError) throw contactsError;

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*');

      if (companiesError) throw companiesError;

      // Create lookup maps
      const contactsMap: Record<string, Contact> = {};
      contactsData?.forEach(c => {
        contactsMap[c.id] = c;
      });

      const companiesMap: Record<string, Company> = {};
      companiesData?.forEach(c => {
        companiesMap[c.id] = c;
      });

      setContacts(contactsMap);
      setCompanies(companiesMap);

      // Enrich follow-ups with contact and company data
      const enrichedFollowUps: FollowUp[] = (interactionsData || []).map(interaction => ({
        ...interaction,
        contact: interaction.contact_id ? contactsMap[interaction.contact_id] : null,
        company: interaction.company_id ? companiesMap[interaction.company_id] : null,
      }));

      setFollowUps(enrichedFollowUps);
    } catch (error) {
      logger.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (id: string) => {
    try {
      const followUp = followUps.find(f => f.id === id);
      
      const { error } = await supabase
        .from('interactions')
        .update({ follow_up_required: false })
        .eq('id', id);

      if (error) throw error;
      
      setFollowUps(prev => prev.filter(f => f.id !== id));
      setSelectedFollowUp(null);
      
      // Trigger celebration
      celebrate({
        type: 'follow-up-complete',
        title: 'Follow-up Concluído! 🎉',
        subtitle: followUp?.contact 
          ? `Ótimo trabalho com ${followUp.contact.first_name}!`
          : 'Continue mantendo seus relacionamentos em dia!',
        duration: 3000,
      });
    } catch (error) {
      logger.error('Error marking as completed:', error);
      toast.error('Erro ao concluir follow-up. Tente novamente.');
    }
  };

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group follow-ups by date
  const followUpsByDate = useMemo(() => {
    const grouped: Record<string, FollowUp[]> = {};
    followUps.forEach(followUp => {
      if (followUp.follow_up_date) {
        const dateKey = followUp.follow_up_date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(followUp);
      }
    });
    return grouped;
  }, [followUps]);

  // Get follow-ups for selected date
  const selectedDateFollowUps = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return followUpsByDate[dateKey] || [];
  }, [selectedDate, followUpsByDate]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const overdue = followUps.filter(f => f.follow_up_date && isPast(parseISO(f.follow_up_date)) && !isToday(parseISO(f.follow_up_date)));
    const todayFollowUps = followUps.filter(f => f.follow_up_date && isToday(parseISO(f.follow_up_date)));
    const upcoming = followUps.filter(f => f.follow_up_date && !isPast(parseISO(f.follow_up_date)) && !isToday(parseISO(f.follow_up_date)));
    
    return {
      total: followUps.length,
      overdue: overdue.length,
      today: todayFollowUps.length,
      upcoming: upcoming.length,
    };
  }, [followUps]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Get padding days for the first week
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  return (
    <AppLayout>
      <Header 
        title="Calendário" 
        subtitle="Acompanhe e gerencie seus follow-ups pendentes"
      />
      
      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />

        {/* Stats with MorphingNumber */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <MorphingNumber value={stats.total} className="text-2xl font-bold" />
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <MorphingNumber value={stats.overdue} className="text-2xl font-bold text-destructive" />
                <p className="text-sm text-muted-foreground">Atrasados</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <MorphingNumber value={stats.today} className="text-2xl font-bold text-orange-500" />
                <p className="text-sm text-muted-foreground">Hoje</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <MorphingNumber value={stats.upcoming} className="text-2xl font-bold text-green-500" />
                <p className="text-sm text-muted-foreground">Próximos</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentMonth(new Date());
                        setSelectedDate(new Date());
                      }}
                    >
                      Hoje
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Padding days */}
                  {paddingDays.map((_, index) => (
                    <div key={`padding-${index}`} className="h-24" />
                  ))}
                  
                  {/* Actual days */}
                  {daysInMonth.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayFollowUps = followUpsByDate[dateKey] || [];
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const hasOverdue = dayFollowUps.some(f => isPast(parseISO(f.follow_up_date!)) && !isToday(parseISO(f.follow_up_date!)));
                    
                    return (
                      <button
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          'h-24 p-1 rounded-lg border transition-all duration-200 flex flex-col',
                          isSelected
                            ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                            : 'border-border/50 hover:border-primary/50 hover:bg-muted/50',
                          isToday(day) && !isSelected && 'border-primary/50 bg-primary/5',
                          !isSameMonth(day, currentMonth) && 'opacity-50'
                        )}
                      >
                        <span className={cn(
                          'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                          isToday(day) && 'bg-primary text-primary-foreground',
                          isSelected && !isToday(day) && 'bg-primary/20'
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {dayFollowUps.length > 0 && (
                          <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                            {dayFollowUps.slice(0, 2).map(followUp => (
                              <div
                                key={followUp.id}
                                className={cn(
                                  'text-xs px-1.5 py-0.5 rounded truncate',
                                  hasOverdue
                                    ? 'bg-destructive/20 text-destructive'
                                    : 'bg-primary/20 text-primary'
                                )}
                              >
                                {followUp.title}
                              </div>
                            ))}
                            {dayFollowUps.length > 2 && (
                              <div className="text-xs text-muted-foreground px-1">
                                +{dayFollowUps.length - 2} mais
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Selected Date Follow-ups */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border/50 shadow-lg h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  {selectedDate 
                    ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                    : 'Selecione uma data'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <AnimatePresence mode="popLayout">
                    {selectedDateFollowUps.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          Nenhum follow-up para esta data
                        </p>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateFollowUps.map((followUp, index) => {
                          const isOverdue = followUp.follow_up_date && isPast(parseISO(followUp.follow_up_date)) && !isToday(parseISO(followUp.follow_up_date));
                          
                          return (
                            <motion.div
                              key={followUp.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                'p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md',
                                isOverdue
                                  ? 'border-destructive/50 bg-destructive/5 hover:border-destructive'
                                  : 'border-border/50 hover:border-primary/50'
                              )}
                              onClick={() => setSelectedFollowUp(followUp)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    'p-2 rounded-lg',
                                    isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                                  )}>
                                    {interactionTypeIcons[followUp.type] || <MessageSquare className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{followUp.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {interactionTypeLabels[followUp.type] || followUp.type}
                                    </p>
                                  </div>
                                </div>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Atrasado
                                  </Badge>
                                )}
                              </div>
                              
                              {followUp.contact && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  <span>{followUp.contact.first_name} {followUp.contact.last_name}</span>
                                </div>
                              )}
                              
                              {followUp.company && (
                                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                  <Building2 className="w-3 h-3" />
                                  <span>{followUp.company.name}</span>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Follow-up Detail Dialog */}
      <Dialog open={!!selectedFollowUp} onOpenChange={() => setSelectedFollowUp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFollowUp && interactionTypeIcons[selectedFollowUp.type]}
              {selectedFollowUp?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFollowUp && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {interactionTypeLabels[selectedFollowUp.type] || selectedFollowUp.type}
                </Badge>
                {selectedFollowUp.follow_up_date && isPast(parseISO(selectedFollowUp.follow_up_date)) && !isToday(parseISO(selectedFollowUp.follow_up_date)) && (
                  <Badge variant="destructive">Atrasado</Badge>
                )}
              </div>

              <Separator />

              {selectedFollowUp.contact && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedFollowUp.contact.first_name} {selectedFollowUp.contact.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">Contato</p>
                  </div>
                </div>
              )}

              {selectedFollowUp.company && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedFollowUp.company.name}</p>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                  </div>
                </div>
              )}

              {selectedFollowUp.content && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm whitespace-pre-wrap">{selectedFollowUp.content}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <Button 
                  className="flex-1 gap-2"
                  onClick={() => markAsCompleted(selectedFollowUp.id)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Marcar como Concluído
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFollowUp(null)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Calendario;
