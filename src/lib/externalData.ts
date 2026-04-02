import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";

interface ExternalQueryOptions {
  table: string;
  filters?: Array<{
    type: 'eq' | 'ilike' | 'in' | 'neq' | 'is';
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

async function callExternalData(body: Record<string, any>): Promise<any> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/functions/v1/external-data`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Edge function error [${response.status}]: ${errorText}`);
  }

  const result = await response.json();
  if (result?.error) throw new Error(result.error);

  return result;
}

export async function queryExternalData<T = any>(options: ExternalQueryOptions): Promise<{ data: T[] | null; count: number | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'select', ...options });
    return { data: result?.data || [], count: result?.count || 0, error: null };
  } catch (err) {
    logger.error('Error querying external data:', err);
    return { data: null, count: null, error: err as Error };
  }
}

export async function insertExternalData<T = any>(table: string, record: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'insert', table, record });
    return { data: result?.data || null, error: null };
  } catch (err) {
    logger.error('Error inserting external data:', err);
    return { data: null, error: err as Error };
  }
}

export async function updateExternalData<T = any>(table: string, id: string, updates: Record<string, any>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'update', table, id, updates });
    return { data: result?.data || null, error: null };
  } catch (err) {
    logger.error('Error updating external data:', err);
    return { data: null, error: err as Error };
  }
}

export async function deleteExternalData(table: string, id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    await callExternalData({ action: 'delete', table, id });
    return { success: true, error: null };
  } catch (err) {
    logger.error('Error deleting external data:', err);
    return { success: false, error: err as Error };
  }
}
