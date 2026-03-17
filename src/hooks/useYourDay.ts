import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, endOfDay, addDays, format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type Insight = Tables<'insights'>;
type Company = Tables<'companies'>;

interface FollowUp {
  interaction: Interaction;
  contact: Contact | null;
  company: Company | null;
}

interface BirthdayContact {
  contact: Contact;
  company: Company | null;
  daysUntil: number;
}

interface NeedsAttention {
  contact: Contact;
  company: Company | null;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  daysSinceContact: number;
}

export interface YourDayData {
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  upcomingBirthdays: BirthdayContact[];
  needsAttention: NeedsAttention[];
  newInsights: Insight[];
  loading: boolean;
}

export function useYourDay(): YourDayData & { refresh: () => Promise<void> } {
  const { user } = useAuth();
  const [data, setData] = useState<YourDayData>({
    todayFollowUps: [],
    overdueFollowUps: [],
    upcomingBirthdays: [],
    needsAttention: [],
    newInsights: [],
    loading: true,
  });

  const fetchYourDayData = useCallback(async () => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');

      // Fetch all required data in parallel
      const [contactsResult, companiesResult, interactionsResult, insightsResult] = await Promise.all([
        supabase.from('contacts').select('*').order('updated_at', { ascending: false }),
        supabase.from('companies').select('*'),
        supabase.from('interactions')
          .select('*')
          .eq('follow_up_required', true)
          .order('follow_up_date', { ascending: true }),
        supabase.from('insights')
          .select('*')
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const contacts = contactsResult.data || [];
      const companies = companiesResult.data || [];
      const interactions = interactionsResult.data || [];
      const insights = insightsResult.data || [];

      // Create lookup maps
      const contactMap = new Map(contacts.map(c => [c.id, c]));
      const companyMap = new Map(companies.map(c => [c.id, c]));

      // Process follow-ups
      const todayFollowUps: FollowUp[] = [];
      const overdueFollowUps: FollowUp[] = [];

      interactions.forEach(interaction => {
        if (!interaction.follow_up_date) return;
        
        const followUpDate = parseISO(interaction.follow_up_date);
        const contact = contactMap.get(interaction.contact_id) || null;
        const company = interaction.company_id ? companyMap.get(interaction.company_id) || null : null;
        
        const followUp: FollowUp = { interaction, contact, company };

        if (isToday(followUpDate)) {
          todayFollowUps.push(followUp);
        } else if (isPast(followUpDate)) {
          overdueFollowUps.push(followUp);
        }
      });

      // Process birthdays (next 7 days)
      const upcomingBirthdays: BirthdayContact[] = [];
      
      contacts.forEach(contact => {
        if (!contact.birthday) return;
        
        const birthday = parseISO(contact.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        // If birthday passed this year, check next year
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 7) {
          const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
          upcomingBirthdays.push({ contact, company, daysUntil });
        }
      });

      // Sort by days until birthday
      upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

      // Process contacts needing attention
      const needsAttention: NeedsAttention[] = [];
      
      contacts.forEach(contact => {
        const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
        const lastUpdate = contact.updated_at ? new Date(contact.updated_at) : new Date(contact.created_at);
        const daysSinceContact = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        // High priority: Low relationship score + long time without contact
        if ((contact.relationship_score || 0) < 30 && daysSinceContact > 14) {
          needsAttention.push({
            contact,
            company,
            reason: 'Score baixo e sem contato há mais de 2 semanas',
            priority: 'high',
            daysSinceContact,
          });
        }
        // Medium priority: Key contacts (decision makers) without recent contact
        else if (
          (contact.role === 'decision_maker' || contact.role === 'owner') &&
          daysSinceContact > 21
        ) {
          needsAttention.push({
            contact,
            company,
            reason: 'Decisor sem contato há mais de 3 semanas',
            priority: 'medium',
            daysSinceContact,
          });
        }
        // Low priority: Any contact with negative sentiment
        else if (contact.sentiment === 'negative' && daysSinceContact > 7) {
          needsAttention.push({
            contact,
            company,
            reason: 'Sentimento negativo precisa de atenção',
            priority: 'low',
            daysSinceContact,
          });
        }
      });

      // Sort by priority and days since contact
      needsAttention.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.daysSinceContact - a.daysSinceContact;
      });

      setData({
        todayFollowUps,
        overdueFollowUps,
        upcomingBirthdays: upcomingBirthdays.slice(0, 5),
        needsAttention: needsAttention.slice(0, 5),
        newInsights: insights,
        loading: false,
      });
    } catch (error) {
      logger.error('Error fetching your day data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchYourDayData();
  }, [fetchYourDayData]);

  return { ...data, refresh: fetchYourDayData };
}
