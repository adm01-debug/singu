import { useMemo } from 'react';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type Company = Tables<'companies'>;
type Interaction = Tables<'interactions'>;

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

interface UseDashboardStatsParams {
  contacts: Contact[];
  companies: Company[];
  interactions: Interaction[];
  loading: boolean;
}

export function useDashboardStats({ contacts = [], companies = [], interactions = [], loading = true }: UseDashboardStatsParams = {} as UseDashboardStatsParams): DashboardStats {
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

    const companiesThisMonth = companies.filter(c => 
      new Date(c.created_at) >= thisMonthStart
    ).length;
    
    const contactsThisMonth = contacts.filter(c => 
      new Date(c.created_at) >= thisMonthStart
    ).length;

    const thisWeekInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      return date >= thisWeekStart && date <= thisWeekEnd;
    }).length;

    const lastWeekInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      return date >= lastWeekStart && date <= lastWeekEnd;
    }).length;

    const interactionDiff = thisWeekInteractions - lastWeekInteractions;

    const scoresWithValue = contacts.filter(c => c.relationship_score !== null && c.relationship_score !== undefined);
    const avgScore = scoresWithValue.length > 0
      ? Math.round(scoresWithValue.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / scoresWithValue.length)
      : 0;

    const companyMap = new Map(companies.map(c => [c.id, c]));

    // Pre-build interaction counts by contact for O(1) lookup
    const interactionCountByContact = new Map<string, number>();
    const latestInteractionByContact = new Map<string, string>();
    for (const i of interactions) {
      interactionCountByContact.set(i.contact_id, (interactionCountByContact.get(i.contact_id) || 0) + 1);
      const current = latestInteractionByContact.get(i.contact_id);
      if (!current || i.created_at > current) latestInteractionByContact.set(i.contact_id, i.created_at);
    }

    const topContacts = [...contacts]
      .filter(c => c.relationship_score !== null)
      .sort((a, b) => (b.relationship_score || 0) - (a.relationship_score || 0))
      .slice(0, 4)
      .map(contact => {
        const company = contact.company_id ? companyMap.get(contact.company_id) : undefined;
        const latestDate = latestInteractionByContact.get(contact.id);
        
        return {
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          avatar: contact.avatar_url,
          companyName: company?.name || 'Sem empresa',
          role: contact.role || 'contact',
          relationshipScore: contact.relationship_score || 0,
          sentiment: contact.sentiment || 'neutral',
          interactionCount: interactionCountByContact.get(contact.id) || 0,
          lastInteraction: latestDate ? new Date(latestDate) : null,
        };
      });

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
      scoreChange: '+0% vs mês anterior',
      topContacts,
      recentActivities,
      loading: false,
    };
  }, [contacts, companies, interactions, loading]);

  return stats;
}
