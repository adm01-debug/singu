import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export type PeriodFilter = '7d' | '30d' | '90d' | '365d';

export interface NLPStats {
  totalAnalyses: number;
  emotionalStates: {
    state: string;
    count: number;
    avgConfidence: number;
  }[];
  vakDistribution: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    digital: number;
  };
  discDistribution: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
  topValues: {
    name: string;
    count: number;
    avgImportance: number;
  }[];
  objectionTypes: {
    type: string;
    count: number;
    resolved: number;
  }[];
  emotionalTrend: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }[];
}

const POSITIVE_EMOTIONS = ['Entusiasmo', 'Confiança', 'Interesse', 'Satisfação'];
const NEGATIVE_EMOTIONS = ['Frustração', 'Ansiedade'];

const EMPTY_STATS: NLPStats = {
  totalAnalyses: 0,
  emotionalStates: [],
  vakDistribution: { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 },
  discDistribution: { D: 0, I: 0, S: 0, C: 0 },
  topValues: [],
  objectionTypes: [],
  emotionalTrend: [],
};

const getPeriodDays = (period: PeriodFilter): number => {
  switch (period) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '365d': return 365;
  }
};

function classifyEmotions(emotions: { emotional_state: string }[]) {
  const positive = emotions.filter(e => POSITIVE_EMOTIONS.includes(e.emotional_state)).length;
  const negative = emotions.filter(e => NEGATIVE_EMOTIONS.includes(e.emotional_state)).length;
  const neutral = Math.max(0, emotions.length - positive - negative);
  return { positive, neutral, negative };
}

function buildTrendData(
  emotionalData: { created_at: string; emotional_state: string }[] | null,
  period: PeriodFilter,
) {
  const days = getPeriodDays(period);
  const now = new Date();
  const data = emotionalData || [];

  if (days <= 7) {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const dayEmotions = data.filter(e => e.created_at.startsWith(dateStr));
      const { positive, neutral, negative } = classifyEmotions(dayEmotions);
      return { date: date.toLocaleDateString('pt-BR', { weekday: 'short' }), positive, neutral, negative };
    });
  }

  if (days <= 30) {
    return Array.from({ length: 4 }, (_, week) => {
      const w = 3 - week;
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (w * 7));
      const weekEmotions = data.filter(e => {
        const d = new Date(e.created_at);
        return d >= weekStart && d <= weekEnd;
      });
      const { positive, neutral, negative } = classifyEmotions(weekEmotions);
      return { date: `Sem ${week + 1}`, positive, neutral, negative };
    });
  }

  const months = days <= 90 ? 3 : 12;
  return Array.from({ length: months }, (_, i) => {
    const m = months - 1 - i;
    const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
    const monthEmotions = data.filter(e => {
      const d = new Date(e.created_at);
      return d >= monthStart && d <= monthEnd;
    });
    const { positive, neutral, negative } = classifyEmotions(monthEmotions);
    return { date: monthStart.toLocaleDateString('pt-BR', { month: 'short' }), positive, neutral, negative };
  });
}

export function useNLPAnalyticsData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [stats, setStats] = useState<NLPStats>(EMPTY_STATS);

  const dateFilter = useMemo(() => {
    const days = getPeriodDays(period);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }, [period]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [emotionalRes, vakRes, contactsRes, valuesRes, objectionsRes] = await Promise.all([
        supabase.from('emotional_states_history').select('*').eq('user_id', user.id).gte('created_at', dateFilter),
        supabase.from('vak_analysis_history' as 'emotional_states_history').select('*').eq('user_id', user.id).gte('created_at', dateFilter),
        supabase.from('contacts').select('behavior').eq('user_id', user.id),
        supabase.from('client_values').select('*').eq('user_id', user.id).gte('created_at', dateFilter),
        supabase.from('hidden_objections').select('*').eq('user_id', user.id).gte('created_at', dateFilter),
      ]);

      const emotionalData = emotionalRes.data;
      const vakData = vakRes.data as { visual_score?: number; auditory_score?: number; kinesthetic_score?: number; digital_score?: number }[] | null;

      // Emotional states
      const emotionalMap = new Map<string, { count: number; totalConfidence: number }>();
      emotionalData?.forEach(e => {
        const cur = emotionalMap.get(e.emotional_state) || { count: 0, totalConfidence: 0 };
        emotionalMap.set(e.emotional_state, { count: cur.count + 1, totalConfidence: cur.totalConfidence + (e.confidence || 0) });
      });
      const emotionalStates = Array.from(emotionalMap.entries())
        .map(([state, d]) => ({ state, count: d.count, avgConfidence: Math.round(d.totalConfidence / d.count) }))
        .sort((a, b) => b.count - a.count);

      // VAK
      const vakTotals = { visual: 0, auditory: 0, kinesthetic: 0, digital: 0 };
      vakData?.forEach(v => {
        vakTotals.visual += v.visual_score || 0;
        vakTotals.auditory += v.auditory_score || 0;
        vakTotals.kinesthetic += v.kinesthetic_score || 0;
        vakTotals.digital += v.digital_score || 0;
      });
      const vakCount = vakData?.length || 1;
      const vakDistribution = {
        visual: Math.round(vakTotals.visual / vakCount),
        auditory: Math.round(vakTotals.auditory / vakCount),
        kinesthetic: Math.round(vakTotals.kinesthetic / vakCount),
        digital: Math.round(vakTotals.digital / vakCount),
      };

      // DISC
      const discCount = { D: 0, I: 0, S: 0, C: 0 };
      contactsRes.data?.forEach(c => {
        const behavior = c.behavior as { disc_profile?: string } | null;
        const disc = behavior?.disc_profile?.toUpperCase();
        if (disc && disc in discCount) discCount[disc as keyof typeof discCount]++;
      });

      // Values
      const valuesMap = new Map<string, { count: number; totalImportance: number }>();
      valuesRes.data?.forEach(v => {
        const cur = valuesMap.get(v.value_name) || { count: 0, totalImportance: 0 };
        valuesMap.set(v.value_name, { count: cur.count + 1, totalImportance: cur.totalImportance + (v.importance || 0) });
      });
      const topValues = Array.from(valuesMap.entries())
        .map(([name, d]) => ({ name, count: d.count, avgImportance: Math.round(d.totalImportance / d.count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Objections
      const objectionMap = new Map<string, { count: number; resolved: number }>();
      objectionsRes.data?.forEach(o => {
        const cur = objectionMap.get(o.objection_type) || { count: 0, resolved: 0 };
        objectionMap.set(o.objection_type, { count: cur.count + 1, resolved: cur.resolved + (o.resolved ? 1 : 0) });
      });
      const objectionTypes = Array.from(objectionMap.entries())
        .map(([type, d]) => ({ type, count: d.count, resolved: d.resolved }))
        .sort((a, b) => b.count - a.count);

      // Trend
      const emotionalTrend = buildTrendData(emotionalData, period);

      const totalAnalyses = (emotionalData?.length || 0) + (vakData?.length || 0) +
        (valuesRes.data?.length || 0) + (objectionsRes.data?.length || 0);

      setStats({ totalAnalyses, emotionalStates, vakDistribution, discDistribution: discCount, topValues, objectionTypes, emotionalTrend });
    } catch (error) {
      logger.error('Error fetching NLP stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dateFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, period, setPeriod, refresh: fetchStats };
}
