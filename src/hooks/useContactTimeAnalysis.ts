import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';

export type ContactTimeAnalysis = Tables<'contact_time_analysis'>;

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}h`);

export interface BestTimeSlot {
  dayOfWeek: number;
  dayLabel: string;
  hourOfDay: number;
  hourLabel: string;
  successRate: number;
  totalAttempts: number;
}

export function useContactTimeAnalysis(contactId?: string) {
  const { user } = useAuth();
  const [timeData, setTimeData] = useState<ContactTimeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !contactId) return;
    try {
      const { data, error } = await supabase
        .from('contact_time_analysis')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id);
      if (error) throw error;
      setTimeData(data || []);
    } catch (err) {
      logger.error('Error fetching contact time analysis:', err);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bestTimes: BestTimeSlot[] = timeData
    .filter(t => (t.total_attempts || 0) > 0)
    .map(t => ({
      dayOfWeek: t.day_of_week,
      dayLabel: DAY_LABELS[t.day_of_week] || '?',
      hourOfDay: t.hour_of_day,
      hourLabel: HOUR_LABELS[t.hour_of_day] || '?',
      successRate: (t.total_attempts || 0) > 0 ? ((t.success_count || 0) / (t.total_attempts || 1)) * 100 : 0,
      totalAttempts: t.total_attempts || 0,
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5);

  const heatmapData = DAY_LABELS.map((dayLabel, dayIdx) => ({
    day: dayLabel,
    hours: Array.from({ length: 24 }, (_, hour) => {
      const slot = timeData.find(t => t.day_of_week === dayIdx && t.hour_of_day === hour);
      return {
        hour,
        successRate: slot && (slot.total_attempts || 0) > 0 ? ((slot.success_count || 0) / (slot.total_attempts || 1)) * 100 : 0,
        attempts: slot?.total_attempts || 0,
      };
    }),
  }));

  return { timeData, bestTimes, heatmapData, loading, refresh: fetchData };
}
