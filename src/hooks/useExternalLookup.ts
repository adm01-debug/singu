import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function fetchDistinctValues(table: string, column: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('external-data', {
    body: { action: 'distinct', table, column },
  });

  if (error) {
    console.error(`Failed to fetch distinct ${column}:`, error);
    return [];
  }

  return data?.values || [];
}

export function useExternalLookup(table: string, column: string, enabled = true) {
  return useQuery({
    queryKey: ['external-lookup', table, column],
    queryFn: () => fetchDistinctValues(table, column),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 min cache
    gcTime: 30 * 60 * 1000,
  });
}
