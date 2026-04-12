import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";
import { getCircuitBreaker, CircuitOpenError } from "@/lib/circuitBreaker";

interface ExternalQueryOptions {
  table: string;
  select?: string;
  filters?: Array<{
    type: 'eq' | 'ilike' | 'in' | 'neq' | 'is';
    column: string;
    value: unknown;
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
  /** Use 'planned' for faster approximate counts */
  countMethod?: 'exact' | 'planned';
}

// Cached auth token to avoid calling getSession() on every request
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null;
  _tokenExpiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
});

async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 30_000) {
    return _cachedToken;
  }
  const { data } = await supabase.auth.getSession();
  _cachedToken = data?.session?.access_token ?? null;
  _tokenExpiresAt = data?.session?.expires_at ? data.session.expires_at * 1000 : 0;
  return _cachedToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-data`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const externalDbBreaker = getCircuitBreaker('external-db', {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
});

async function callExternalData(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return externalDbBreaker.call(async () => {
    const accessToken = await getAccessToken();

    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': ANON_KEY,
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
  });
}

export { CircuitOpenError };

export async function queryExternalData<T = Record<string, unknown>>(options: ExternalQueryOptions): Promise<{ data: T[] | null; count: number | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'select', ...options });
    return { data: (result?.data as T[]) || [], count: (result?.count as number) || 0, error: null };
  } catch (err) {
    logger.error('Error querying external data:', err);
    return { data: null, count: null, error: err as Error };
  }
}

export async function insertExternalData<T = Record<string, unknown>>(table: string, record: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'insert', table, record });
    return { data: (result?.data as T) || null, error: null };
  } catch (err) {
    logger.error('Error inserting external data:', err);
    return { data: null, error: err as Error };
  }
}

export async function updateExternalData<T = Record<string, unknown>>(table: string, id: string, updates: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'update', table, id, updates });
    return { data: (result?.data as T) || null, error: null };
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
