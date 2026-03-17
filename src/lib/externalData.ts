import { supabase } from '@/integrations/supabase/client';

interface ExternalQueryOptions {
  table: 'companies' | 'contacts';
  select?: string;
  filters?: Array<{
    type: 'eq' | 'ilike' | 'in';
    column: string;
    value: any;
  }>;
  search?: {
    term: string;
    columns: string[];
  };
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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const url = `${supabaseUrl}/functions/v1/external-data`;
    
    // Get session for auth header
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(options),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge function error [${response.status}]: ${errorText}`);
    }

    const result = await response.json();

    if (result?.error) {
      return { data: null, count: null, error: new Error(result.error) };
    }

    return { data: result?.data || [], count: result?.count || 0, error: null };
  } catch (err) {
    return { data: null, count: null, error: err as Error };
  }
}
