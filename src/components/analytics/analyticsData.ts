import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { differenceInDays, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsContact {
  id: string;
  first_name: string;
  last_name: string;
  relationship_score: number | null;
  sentiment: string | null;
  created_at: string;
  updated_at: string;
  behavior: unknown;
}

interface AnalyticsInteraction {
  id: string;
  contact_id: string;
  type: string;
  sentiment: string | null;
  channel: string | null;
  created_at: string;
}

interface PreviousInteraction {
  id: string;
  sentiment: string | null;
  created_at: string;
}

export type PeriodFilter = '7d' | '30d' | '90d' | '365d';

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export const calcChange = (current: number, previous: number): PeriodComparison => {
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
  return {
    current,
    previous,
    change,
    changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
  };
};

export const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '365d', label: 'Último ano' },
];

const PERIOD_DAYS: Record<PeriodFilter, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
};

// Module-level storage for previous period comparison (avoids polluting window)
let _prevInteractions: PreviousInteraction[] = [];

export function useAnalyticsData(period: PeriodFilter) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<AnalyticsContact[]>([]);
  const [interactions, setInteractions] = useState<AnalyticsInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const days = PERIOD_DAYS[period];
        const cutoff = subDays(new Date(), days).toISOString();
        const previousCutoff = subDays(new Date(), days * 2).toISOString();

        const [contactsRes, interactionsRes, previousInteractionsRes] = await Promise.all([
          supabase
            .from('contacts')
            .select(
              'id, first_name, last_name, relationship_score, sentiment, created_at, updated_at, behavior',
            )
            .order('relationship_score', { ascending: false }),
          supabase
            .from('interactions')
            .select('id, contact_id, type, sentiment, channel, created_at')
            .gte('created_at', cutoff)
            .order('created_at', { ascending: true }),
          supabase
            .from('interactions')
            .select('id, sentiment, created_at')
            .gte('created_at', previousCutoff)
            .lt('created_at', cutoff),
        ]);

        setContacts(contactsRes.data || []);
        setInteractions(interactionsRes.data || []);

        // Store previous period interactions for comparison
        _prevInteractions = previousInteractionsRes.data || [];
      } catch (error) {
        logger.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, period]);

  const stats = useMemo(() => {
    const prevInteractions = _prevInteractions;

    const totalCurrent = interactions.length;
    const totalPrevious = prevInteractions.length;

    const avgScore =
      contacts.length > 0
        ? Math.round(
            contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / contacts.length,
          )
        : 0;

    const positiveInteractions = interactions.filter(
      (i) => i.sentiment === 'positive' || i.sentiment === 'positivo',
    ).length;
    const positiveRate =
      totalCurrent > 0 ? Math.round((positiveInteractions / totalCurrent) * 100) : 0;

    const prevPositive = prevInteractions.filter(
      (i) => i.sentiment === 'positive' || i.sentiment === 'positivo',
    ).length;
    const prevPositiveRate =
      totalPrevious > 0 ? Math.round((prevPositive / totalPrevious) * 100) : 0;

    const activeContacts = new Set(interactions.map((i) => i.contact_id)).size;
    const engagementRate =
      contacts.length > 0 ? Math.round((activeContacts / contacts.length) * 100) : 0;

    return {
      totalInteractions: calcChange(totalCurrent, totalPrevious),
      avgScore: calcChange(avgScore, avgScore), // No previous score tracking yet
      positiveRate: calcChange(positiveRate, prevPositiveRate),
      engagementRate: calcChange(engagementRate, engagementRate),
    };
  }, [contacts, interactions]);

  const relationshipEvolution = useMemo(() => {
    if (interactions.length === 0) return [];

    const days = PERIOD_DAYS[period];
    const buckets: Record<
      string,
      { score: number; count: number; newContacts: number; interactions: number }
    > = {};

    if (days <= 7) {
      // Daily buckets
      for (let i = 0; i < 7; i++) {
        const d = subDays(new Date(), 6 - i);
        const key = format(d, 'EEE', { locale: ptBR });
        buckets[key] = { score: 0, count: 0, newContacts: 0, interactions: 0 };
      }
      interactions.forEach((inter) => {
        const key = format(new Date(inter.created_at), 'EEE', { locale: ptBR });
        if (buckets[key]) buckets[key].interactions++;
      });
      contacts.forEach((c) => {
        const daysDiff = differenceInDays(new Date(), new Date(c.created_at));
        if (daysDiff <= 7) {
          const key = format(new Date(c.created_at), 'EEE', { locale: ptBR });
          if (buckets[key]) buckets[key].newContacts++;
        }
      });
    } else if (days <= 30) {
      // Weekly buckets
      for (let i = 0; i < 4; i++) {
        buckets[`Sem ${i + 1}`] = { score: 0, count: 0, newContacts: 0, interactions: 0 };
      }
      interactions.forEach((inter) => {
        const daysDiff = differenceInDays(new Date(), new Date(inter.created_at));
        const weekIdx = Math.min(3, Math.floor(daysDiff / 7));
        const key = `Sem ${4 - weekIdx}`;
        if (buckets[key]) buckets[key].interactions++;
      });
    } else {
      // Monthly buckets
      const months = days <= 90 ? 3 : 12;
      for (let i = 0; i < months; i++) {
        const d = subDays(new Date(), (months - 1 - i) * 30);
        const key = format(d, 'MMM', { locale: ptBR });
        buckets[key] = { score: 0, count: 0, newContacts: 0, interactions: 0 };
      }
      interactions.forEach((inter) => {
        const key = format(new Date(inter.created_at), 'MMM', { locale: ptBR });
        if (buckets[key]) buckets[key].interactions++;
      });
    }

    // Calculate avg score per bucket (use overall since we don't track historical scores)
    const avgScore =
      contacts.length > 0
        ? Math.round(
            contacts.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / contacts.length,
          )
        : 0;

    return Object.entries(buckets).map(([date, data]) => ({
      date,
      score: avgScore,
      newContacts: data.newContacts,
      interactions: data.interactions,
    }));
  }, [interactions, contacts, period]);

  const topPerformers = useMemo(() => {
    return contacts
      .filter((c) => (c.relationship_score || 0) > 0)
      .slice(0, 5)
      .map((c) => ({
        name: `${c.first_name} ${c.last_name || ''}`.trim(),
        score: c.relationship_score || 0,
        interactions: interactions.filter((i) => i.contact_id === c.id).length,
        sentiment: c.sentiment || 'neutro',
      }));
  }, [contacts, interactions]);

  const sentimentDistribution = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    interactions.forEach((i) => {
      const s = i.sentiment?.toLowerCase();
      if (s === 'positive' || s === 'positivo') counts.positive++;
      else if (s === 'negative' || s === 'negativo') counts.negative++;
      else counts.neutral++;
    });
    return [
      { name: 'Positivo', value: counts.positive, prevValue: 0 },
      { name: 'Neutro', value: counts.neutral, prevValue: 0 },
      { name: 'Negativo', value: counts.negative, prevValue: 0 },
    ];
  }, [interactions]);

  const engagementByChannel = useMemo(() => {
    const channels: Record<string, number> = {};
    interactions.forEach((i) => {
      const ch = i.channel || i.type || 'Outro';
      channels[ch] = (channels[ch] || 0) + 1;
    });
    const total = interactions.length || 1;
    return Object.entries(channels)
      .map(([channel, count]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1),
        sent: count,
        received: Math.round(count * 0.75),
        rate: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.sent - a.sent);
  }, [interactions]);

  const engagementRadar = useMemo(() => {
    const totalContacts = contacts.length || 1;
    const activeContactIds = new Set(interactions.map((i) => i.contact_id));
    const frequency = Math.min(
      100,
      Math.round((interactions.length / (PERIOD_DAYS[period] || 30)) * 10),
    );
    const responseRate =
      totalContacts > 0 ? Math.round((activeContactIds.size / totalContacts) * 100) : 0;
    const positiveRate =
      interactions.length > 0
        ? Math.round(
            (interactions.filter((i) => i.sentiment === 'positive' || i.sentiment === 'positivo')
              .length /
              interactions.length) *
              100,
          )
        : 0;

    return [
      { metric: 'Frequência', value: Math.min(100, frequency), fullMark: 100 },
      { metric: 'Resposta', value: responseRate, fullMark: 100 },
      { metric: 'Qualidade', value: positiveRate, fullMark: 100 },
      { metric: 'Proatividade', value: Math.min(100, Math.round(frequency * 0.8)), fullMark: 100 },
      { metric: 'Follow-up', value: Math.min(100, responseRate), fullMark: 100 },
      { metric: 'Conversão', value: Math.round(positiveRate * 0.6), fullMark: 100 },
    ];
  }, [contacts, interactions, period]);

  return {
    loading,
    stats,
    relationshipEvolution,
    topPerformers,
    sentimentDistribution,
    engagementByChannel,
    engagementRadar,
    contacts,
    interactions,
  };
}

// Keep color config exports
export const getSentimentColors = () => ({
  Positivo: 'hsl(142, 76%, 36%)',
  Neutro: 'hsl(215, 16%, 47%)',
  Negativo: 'hsl(0, 84%, 60%)',
});
