import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDealsPipeline, type PipelineDeal } from '@/hooks/usePipeline';

export interface DealAtRisk {
  deal: PipelineDeal;
  score: number;
  level: 'healthy' | 'attention' | 'high';
  topFactor: string;
}

const STAGE_BENCHMARK_DAYS: Record<string, number> = {
  lead: 7,
  primeiro_contato: 7,
  qualificacao: 14,
  proposta: 10,
  negociacao: 21,
  fechamento: 14,
};

const sentimentValue = (s: string | null): number => {
  if (!s) return 0;
  const v = s.toLowerCase();
  if (v === 'positive' || v === 'positivo') return 1;
  if (v === 'negative' || v === 'negativo') return -1;
  return 0;
};

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function useDealsAtRisk(limit = 5) {
  const { data: deals } = useDealsPipeline();

  return useQuery<DealAtRisk[]>({
    queryKey: ['deals-at-risk', deals?.map((d) => d.id).join(',')],
    enabled: !!deals && deals.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const open = (deals ?? []).filter(
        (d) => d.status !== 'ganho' && d.status !== 'perdido'
      );
      if (open.length === 0) return [];

      const contactIds = Array.from(
        new Set(open.map((d) => d.contact_id).filter(Boolean) as string[])
      );

      const since = new Date();
      since.setDate(since.getDate() - 60);

      const { data: interactions } = contactIds.length > 0
        ? await supabase
            .from('interactions')
            .select('contact_id, sentiment, created_at, direction')
            .in('contact_id', contactIds)
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: false })
            .limit(500)
        : { data: [] as Array<{ contact_id: string; sentiment: string | null; created_at: string; direction: string | null }> };

      const byContact = new Map<string, typeof interactions>();
      (interactions ?? []).forEach((row) => {
        const list = byContact.get(row.contact_id) ?? [];
        list.push(row);
        byContact.set(row.contact_id, list);
      });

      const results: DealAtRisk[] = open.map((deal) => {
        const stage = deal.pipeline_stage || 'lead';
        const benchmark = STAGE_BENCHMARK_DAYS[stage] ?? 14;
        const daysInStage = deal.dias_no_estagio_atual ?? 0;
        const stagnation = clamp(((daysInStage / benchmark - 1) / 2) * 100);

        const list = (deal.contact_id && byContact.get(deal.contact_id)) || [];
        const recent = list.slice(0, 5);
        const avgSent = recent.length
          ? recent.reduce((a, b) => a + sentimentValue(b.sentiment), 0) / recent.length
          : 0;
        const sentimentScore = clamp(((-avgSent + 1) / 2) * 100);

        const inbound = list.find((r) => r.direction === 'inbound');
        const daysSince = inbound
          ? Math.floor((Date.now() - new Date(inbound.created_at).getTime()) / 86400000)
          : 60;
        const engagement = clamp((daysSince / 30) * 100);

        const totalAge = deal.created_at
          ? Math.floor((Date.now() - new Date(deal.created_at).getTime()) / 86400000)
          : 0;
        const age = clamp((totalAge / 60 - 0.5) * 100);

        const score = Math.round(
          stagnation * 0.4 + sentimentScore * 0.25 + engagement * 0.25 + age * 0.1
        );
        const level: DealAtRisk['level'] =
          score >= 61 ? 'high' : score >= 31 ? 'attention' : 'healthy';

        const factorMap: Array<[number, string]> = [
          [stagnation, 'Estagnação'],
          [sentimentScore, 'Sentimento'],
          [engagement, 'Engajamento'],
          [age, 'Idade'],
        ];
        const topFactor = factorMap.sort((a, b) => b[0] - a[0])[0][1];

        return { deal, score, level, topFactor };
      });

      return results
        .filter((r) => r.level !== 'healthy')
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
  });
}
