import { useMemo } from 'react';
import { useContacts } from './useContacts';
import { useCompanies } from './useCompanies';
import { useInteractions } from './useInteractions';
import { differenceInDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface TopContact {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  companyName: string;
  role: string;
  relationshipScore: number;
  sentiment: string;
  interactionCount: number;
  lastInteraction: Date | null;
}

interface RecentActivity {
  id: string;
  entityName: string;
  description: string;
  createdAt: Date;
  type: string;
}

export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  weeklyInteractions: number;
  averageScore: number;
  companyChange: string;
  contactChange: string;
  interactionChange: string;
  scoreChange: string;
  topContacts: TopContact[];
  recentActivities: RecentActivity[];
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { contacts, loading: contactsLoading } = useContacts();
  const { companies, loading: companiesLoading } = useCompanies();
  const { interactions, loading: interactionsLoading } = useInteractions();

  const loading = contactsLoading || companiesLoading || interactionsLoading;

  const stats = useMemo(() => {
    if (loading) {
      return {
        totalCompanies: 0,
        totalContacts: 0,
        weeklyInteractions: 0,
        averageScore: 0,
        companyChange: '',
        contactChange: '',
        interactionChange: '',
        scoreChange: '',
        topContacts: [],
        recentActivities: [],
        loading: true,
      };
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Companies created this month
    const companiesThisMonth = companies.filter(c => 
      new Date(c.created_at) >= thisMonthStart
    ).length;
    
    // Contacts created this month
    const contactsThisMonth = contacts.filter(c => 
      new Date(c.created_at) >= thisMonthStart
    ).length;

    // Weekly interactions
    const thisWeekInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      return date >= thisWeekStart && date <= thisWeekEnd;
    }).length;

    const lastWeekInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      return date >= lastWeekStart && date <= lastWeekEnd;
    }).length;

    const interactionDiff = thisWeekInteractions - lastWeekInteractions;

    // Average relationship score
    const scoresWithValue = contacts.filter(c => c.relationship_score !== null && c.relationship_score !== undefined);
    const avgScore = scoresWithValue.length > 0
      ? Math.round(scoresWithValue.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / scoresWithValue.length)
      : 0;

    // Top contacts by score
    const topContacts = [...contacts]
      .filter(c => c.relationship_score !== null)
      .sort((a, b) => (b.relationship_score || 0) - (a.relationship_score || 0))
      .slice(0, 4)
      .map(contact => {
        const company = companies.find(c => c.id === contact.company_id);
        const contactInteractions = interactions.filter(i => i.contact_id === contact.id);
        const lastInteraction = contactInteractions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        return {
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          avatar: contact.avatar_url,
          companyName: company?.name || 'Sem empresa',
          role: contact.role || 'contact',
          relationshipScore: contact.relationship_score || 0,
          sentiment: contact.sentiment || 'neutral',
          interactionCount: contactInteractions.length,
          lastInteraction: lastInteraction ? new Date(lastInteraction.created_at) : null,
        };
      });

    // Recent activities from interactions
    const recentActivities = interactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(interaction => {
        const contact = contacts.find(c => c.id === interaction.contact_id);
        return {
          id: interaction.id,
          entityName: contact ? `${contact.first_name} ${contact.last_name}` : 'Contato',
          description: interaction.title,
          createdAt: new Date(interaction.created_at),
          type: interaction.type,
        };
      });

    return {
      totalCompanies: companies.length,
      totalContacts: contacts.length,
      weeklyInteractions: thisWeekInteractions,
      averageScore: avgScore,
      companyChange: companiesThisMonth > 0 ? `+${companiesThisMonth} este mês` : 'Nenhuma nova',
      contactChange: contactsThisMonth > 0 ? `+${contactsThisMonth} este mês` : 'Nenhum novo',
      interactionChange: interactionDiff >= 0 
        ? `+${interactionDiff} vs semana anterior` 
        : `${interactionDiff} vs semana anterior`,
      scoreChange: '+0% vs mês anterior', // Would need historical data
      topContacts,
      recentActivities,
      loading: false,
    };
  }, [contacts, companies, interactions, loading]);

  return stats;
}
