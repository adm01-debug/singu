import { useQuery } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';

export interface CompanyStatistics {
  total_contacts: number;
  total_interactions: number;
  total_deals: number;
  open_deals: number;
  open_deals_value: number;
  won_deals_value: number;
  total_proposals: number;
  total_meetings: number;
  total_tasks: number;
  avg_relationship_score: number;
  last_interaction_at: string | null;
  days_since_last_interaction: number | null;
}

export interface CompanyTimelineEvent {
  event_type: string;
  event_date: string;
  title: string;
  description?: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: Record<string, unknown>;
}

export interface Company360 {
  id: string;
  name: string;
  cnpj?: string;
  industry?: string;
  health_score?: number;
  rfm_segment?: string;
  total_contacts?: number;
  total_revenue?: number;
  churn_risk?: number;
  top_contacts?: Array<{ id: string; name: string; role?: string; score?: number }>;
  recent_activities?: Array<{ type: string; date: string; description: string }>;
  key_metrics?: Record<string, unknown>;
}

/**
 * Fetches company stats from `vw_companies_stats` view (exists in external DB).
 * Replaces the non-existent `get_company_statistics` RPC.
 */
export function useCompanyStatistics(companyId?: string) {
  return useQuery({
    queryKey: ['company-statistics', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<CompanyStatistics>({
        table: 'vw_companies_stats',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'id', value: companyId }] : [],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Fetches company summary from `v_company_summary` view as a 360° proxy.
 * Replaces the non-existent `get_company_360` RPC.
 */
export function useCompany360(companyId?: string) {
  return useQuery({
    queryKey: ['company-360', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<Record<string, unknown>>({
        table: 'v_company_summary',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'id', value: companyId }] : [],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      return {
        id: row.id as string,
        name: (row.nome_crm || row.nome_fantasia || row.razao_social || '') as string,
        cnpj: row.cnpj as string | undefined,
        industry: row.ramo_atividade as string | undefined,
        health_score: row.health_score as number | undefined,
        rfm_segment: row.rfm_segment as string | undefined,
        total_contacts: row.total_contacts as number | undefined,
        total_revenue: row.total_revenue as number | undefined,
        churn_risk: row.churn_risk as number | undefined,
      } as Company360;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Uses the existing `get_company_health_score` RPC (verified to exist).
 */
export function useCompanyHealthScore(companyId?: string) {
  return useQuery({
    queryKey: ['company-health-score', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc('get_company_health_score', {
        p_company_id: companyId,
      });
      if (error) throw error;
      return data as { score: number; factors: Record<string, number>; level: string } | null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Fetches duplicates from `vw_companies_duplicatas` view (exists in external DB).
 * Replaces the non-existent `get_duplicate_companies` RPC.
 */
export function useCompanyDuplicates(companyId?: string) {
  return useQuery({
    queryKey: ['company-duplicates', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<Record<string, unknown>>({
        table: 'vw_companies_duplicatas',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'company_id', value: companyId }] : [],
        range: { from: 0, to: 19 },
      });
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.duplicate_id as string || row.id as string,
        name: row.nome_crm as string || '',
        cnpj: row.cnpj as string | undefined,
        similarity: (row.similarity as number) || 0,
      }));
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

/**
 * Timeline is not available as a view or RPC in the external DB.
 * Returns empty array gracefully — can be populated when the RPC is created.
 */
export function useCompanyTimeline(companyId?: string, _limit = 30) {
  return useQuery({
    queryKey: ['company-timeline', companyId],
    queryFn: async (): Promise<CompanyTimelineEvent[]> => {
      // RPC get_company_timeline does not exist in external DB.
      // Return empty to avoid errors. Data will appear once the RPC is created.
      return [];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}
