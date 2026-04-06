import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isPast } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

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

// Lightweight contact type for dashboard — excludes heavy fields like behavior/life_events
const CONTACT_LIGHT_SELECT = 'id, first_name, last_name, email, phone, avatar_url, birthday, company_id, role, relationship_score, sentiment, updated_at, created_at';
const COMPANY_LIGHT_SELECT = 'id, name';
const INTERACTION_FOLLOWUP_SELECT = 'id, type, title, content, sentiment, follow_up_required, follow_up_date, created_at, contact_id, company_id, user_id';

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

      // Fetch only what we need, in parallel, with limits and lean selects
      const [followUpsResult, birthdayContactsResult, attentionContactsResult, insightsResult] = await Promise.all([
        // Follow-ups: only interactions that need follow-up (limited)
        supabase
          .from('interactions')
          .select(INTERACTION_FOLLOWUP_SELECT)
          .eq('follow_up_required', true)
          .not('follow_up_date', 'is', null)
          .order('follow_up_date', { ascending: true })
          .limit(50),

        // Birthday contacts: only contacts with birthdays set (limited)
        supabase
          .from('contacts')
          .select(CONTACT_LIGHT_SELECT)
          .not('birthday', 'is', null)
          .limit(200),

        // Needs attention: contacts with low score or negative sentiment
        supabase
          .from('contacts')
          .select(CONTACT_LIGHT_SELECT)
          .or('relationship_score.lt.30,sentiment.eq.negative,role.eq.decision_maker,role.eq.owner')
          .order('updated_at', { ascending: true })
          .limit(50),

        // Insights: only non-dismissed, recent
        supabase
          .from('insights')
          .select('*')
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const followUpInteractions = (followUpsResult.data || []) as Interaction[];
      const birthdayContacts = (birthdayContactsResult.data || []) as Contact[];
      const attentionContacts = (attentionContactsResult.data || []) as Contact[];
      const insights = (insightsResult.data || []) as Insight[];

      // Collect unique company IDs from all results for a single batch lookup
      const companyIds = new Set<string>();
      const contactIds = new Set<string>();

      followUpInteractions.forEach(i => {
        if (i.company_id) companyIds.add(i.company_id);
        contactIds.add(i.contact_id);
      });
      birthdayContacts.forEach(c => { if (c.company_id) companyIds.add(c.company_id); });
      attentionContacts.forEach(c => { if (c.company_id) companyIds.add(c.company_id); });

      // Batch fetch related contacts and companies
      const [contactsForFollowUps, companiesBatch] = await Promise.all([
        contactIds.size > 0
          ? supabase.from('contacts').select(CONTACT_LIGHT_SELECT).in('id', Array.from(contactIds)).limit(100)
          : Promise.resolve({ data: [] }),
        companyIds.size > 0
          ? supabase.from('companies').select(COMPANY_LIGHT_SELECT).in('id', Array.from(companyIds)).limit(100)
          : Promise.resolve({ data: [] }),
      ]);

      const contactMap = new Map((contactsForFollowUps.data || []).map((c: any) => [c.id, c as Contact]));
      const companyMap = new Map((companiesBatch.data || []).map((c: any) => [c.id, c as Company]));

      // Process follow-ups
      const todayFollowUps: FollowUp[] = [];
      const overdueFollowUps: FollowUp[] = [];

      followUpInteractions.forEach(interaction => {
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
      
      birthdayContacts.forEach(contact => {
        if (!contact.birthday) return;
        
        const birthday = parseISO(contact.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 7) {
          const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
          upcomingBirthdays.push({ contact, company, daysUntil });
        }
      });

      upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

      // Process contacts needing attention
      const needsAttention: NeedsAttention[] = [];
      
      const isValidContactName = (c: Contact) => {
        const firstName = (c.first_name || '').trim();
        const lastName = (c.last_name || '').trim();
        const name = `${firstName} ${lastName}`.trim();
        if (!name) return false;
        // Require both first and last name for quality
        if (!firstName || !lastName) return false;
        // Filter placeholder names from CRM import ("Contato — editar", "Posto — editar")
        if (/[—–-]\s*editar$/i.test(name)) return false;
        if (/^(contato|posto|cargo|teste?)\b/i.test(firstName) && firstName.length < 20) return false;
        // Filter phone-formatted names, emails, test data, WhatsApp auto-contacts
        if (/^\(\d+\)\s*\d+/.test(firstName)) return false;
        if (firstName.includes('@')) return false;
        if (/^test/i.test(name)) return false;
        if (firstName.toLowerCase() === 'whatsapp' && /^\d+$/.test(lastName)) return false;
        if (/^\d{10,}$/.test(lastName)) return false;
        // Filter names that look like company names (multi-word first name with no last name already caught above)
        if (firstName.split(/\s+/).length >= 2 && !lastName) return false;
        return true;
      };

      // Deduplicate attentionContacts (OR query can return same contact for multiple conditions)
      const seenContactIds = new Set<string>();
      const uniqueAttentionContacts = attentionContacts.filter(isValidContactName).filter(c => {
        if (seenContactIds.has(c.id)) return false;
        seenContactIds.add(c.id);
        return true;
      });

      uniqueAttentionContacts.forEach(contact => {
        const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
        const lastUpdate = contact.updated_at ? new Date(contact.updated_at) : new Date(contact.created_at);
        const daysSinceContact = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        if ((contact.relationship_score || 0) < 30 && daysSinceContact > 14) {
          needsAttention.push({
            contact, company,
            reason: 'Score baixo e sem contato há mais de 2 semanas',
            priority: 'high',
            daysSinceContact,
          });
        } else if (
          (contact.role === 'decision_maker' || contact.role === 'owner') &&
          daysSinceContact > 21
        ) {
          needsAttention.push({
            contact, company,
            reason: 'Decisor sem contato há mais de 3 semanas',
            priority: 'medium',
            daysSinceContact,
          });
        } else if (contact.sentiment === 'negative' && daysSinceContact > 7) {
          needsAttention.push({
            contact, company,
            reason: 'Sentimento negativo precisa de atenção',
            priority: 'low',
            daysSinceContact,
          });
        }
      });

      // Deduplicate by contact id — keep highest priority entry
      const deduped = new Map<string, NeedsAttention>();
      needsAttention.forEach(item => {
        const existing = deduped.get(item.contact.id);
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        if (!existing || priorityOrder[item.priority] < priorityOrder[existing.priority]) {
          deduped.set(item.contact.id, item);
        }
      });

      // Also deduplicate by display name — keep highest priority/score to avoid visual repetition
      const byName = new Map<string, NeedsAttention>();
      deduped.forEach((item) => {
        const displayName = `${item.contact.first_name} ${item.contact.last_name}`.trim().toLowerCase();
        const existing = byName.get(displayName);
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        if (!existing || priorityOrder[item.priority] < priorityOrder[existing.priority]) {
          byName.set(displayName, item);
        }
      });

      const dedupedAttention = Array.from(byName.values());
      dedupedAttention.sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.daysSinceContact - a.daysSinceContact;
      });

      setData({
        todayFollowUps,
        overdueFollowUps,
        upcomingBirthdays: upcomingBirthdays.slice(0, 5),
        needsAttention: dedupedAttention.slice(0, 5),
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
