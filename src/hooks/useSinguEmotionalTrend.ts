import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SinguEmotionalTrendRecord {
  contact_id?: string;
  contact_name?: string;
  current_state?: string;
  trend_direction?: string;
  avg_confidence?: number;
  dominant_emotion?: string;
  emotion_count?: number;
  last_analyzed_at?: string;
  positive_pct?: number;
  negative_pct?: number;
  neutral_pct?: number;
  [key: string]: unknown;
}

export function useSinguEmotionalTrend(limit = 50) {
  return useQuery({
    queryKey: ['vw-singu-emotional-trend', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData<SinguEmotionalTrendRecord>({
        table: 'vw_singu_emotional_trend',
        select: '*',
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
