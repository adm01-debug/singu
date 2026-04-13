import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { toast } from 'sonner';

export interface Territory {
  id: string;
  name: string;
  description?: string;
  region?: string;
  state?: string;
  city?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  company_count?: number;
  contact_count?: number;
  deal_count?: number;
  total_revenue?: number;
  created_at?: string;
}

export interface TerritoryPerformance {
  territory_id: string;
  territory_name: string;
  total_deals: number;
  won_deals: number;
  total_revenue: number;
  conversion_rate: number;
  avg_deal_size: number;
  active_companies: number;
}

export function useTerritories() {
  return useQuery({
    queryKey: ['territories'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Territory[]>('get_territories', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTerritoryPerformance() {
  return useQuery({
    queryKey: ['territory-performance'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<TerritoryPerformance[]>(
        'get_territory_performance', {}
      );
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateTerritory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (territory: Partial<Territory>) => {
      const { data, error } = await callExternalRpc('create_territory', { p_territory: territory });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['territories'] });
      toast.success('Território criado com sucesso');
    },
    onError: () => toast.error('Erro ao criar território'),
  });
}
