import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

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

export function useCompanyStatistics(companyId?: string) {
  return useQuery({
    queryKey: ['company-statistics', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc('get_company_statistics', {
        p_company_id: companyId,
      });
      if (error) throw error;
      return (data as CompanyStatistics) || null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCompanyTimeline(companyId?: string, limit = 30) {
  return useQuery({
    queryKey: ['company-timeline', companyId, limit],
    queryFn: async () => {
      const { data, error } = await callExternalRpc('get_company_timeline', {
        p_company_id: companyId,
        p_limit: limit,
      });
      if (error) throw error;
      return (data as CompanyTimelineEvent[]) || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCompany360(companyId?: string) {
  return useQuery({
    queryKey: ['company-360', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc('get_company_360', {
        p_company_id: companyId,
      });
      if (error) throw error;
      return (data as Company360) || null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

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

export function useCompanyDuplicates(companyId?: string) {
  return useQuery({
    queryKey: ['company-duplicates', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc('get_duplicate_companies', {
        p_company_id: companyId,
      });
      if (error) throw error;
      return (data as Array<{ id: string; name: string; cnpj?: string; similarity: number }>) || [];
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}
