import { supabase } from '@/integrations/supabase/client';

interface ExternalQueryOptions {
  table: 'companies' | 'contacts';
  select?: string;
  filters?: Array<{
    type: 'eq' | 'ilike' | 'in';
    column: string;
    value: any;
  }>;
  order?: {
    column: string;
    ascending?: boolean;
  };
  range?: {
    from: number;
    to: number;
  };
}

export async function queryExternalData<T = any>(options: ExternalQueryOptions): Promise<{ data: T[] | null; count: number | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('external-data', {
      body: options,
    });

    if (error) {
      console.error('External data function error:', error);
      return { data: null, count: null, error };
    }

    if (data?.error) {
      return { data: null, count: null, error: new Error(data.error) };
    }

    return { data: data?.data || [], count: data?.count || 0, error: null };
  } catch (err) {
    console.error('Error querying external data:', err);
    return { data: null, count: null, error: err as Error };
  }
}
