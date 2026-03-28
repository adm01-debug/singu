import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format, isToday, parseISO, isPast } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCelebration } from '@/components/celebrations/CelebrationProvider';
import { logger } from '@/lib/logger';
import type { FollowUp, Contact, Company } from '@/components/calendario/types';
import { CalendarioStats } from '@/components/calendario/CalendarioStats';
import { CalendarGrid } from '@/components/calendario/CalendarGrid';
import { FollowUpSidebar } from '@/components/calendario/FollowUpSidebar';
import { FollowUpDetailDialog } from '@/components/calendario/FollowUpDetailDialog';

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

  return (
    <AppLayout>
      <Header
        title="Calendário"
        subtitle="Acompanhe e gerencie seus follow-ups pendentes"
      />

      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />

        <CalendarioStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CalendarGrid
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            followUpsByDate={followUpsByDate}
            onMonthChange={setCurrentMonth}
            onDateSelect={setSelectedDate}
          />

          <FollowUpSidebar
            selectedDate={selectedDate}
            followUps={selectedDateFollowUps}
            onSelectFollowUp={setSelectedFollowUp}
          />
        </div>
      </div>

      <FollowUpDetailDialog
        followUp={selectedFollowUp}
        onClose={() => setSelectedFollowUp(null)}
        onMarkCompleted={markAsCompleted}
      />
    </AppLayout>
  );
};

export default Calendario;
