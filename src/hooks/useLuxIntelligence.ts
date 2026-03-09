import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface LuxIntelligenceRecord {
  id: string;
  user_id: string;
  entity_type: 'contact' | 'company';
  entity_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  request_type: string;
  social_profiles: any[];
  social_analysis: any;
  fiscal_data: any;
  stakeholders: any[];
  audience_analysis: any;
  personal_profile: any;
  ai_report: string | null;
  ai_summary: string | null;
  fields_updated: any[];
  error_message: string | null;
  n8n_execution_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLuxIntelligence(entityType: 'contact' | 'company', entityId?: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<LuxIntelligenceRecord[]>([]);
  const [latestRecord, setLatestRecord] = useState<LuxIntelligenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!user || !entityId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lux_intelligence')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      const typed = (data || []) as unknown as LuxIntelligenceRecord[];
      setRecords(typed);
      setLatestRecord(typed[0] || null);
    } catch (err) {
      console.error('Error fetching lux records:', err);
    } finally {
      setLoading(false);
    }
  }, [user, entityType, entityId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Poll for updates when there's a processing record
  useEffect(() => {
    if (!latestRecord || latestRecord.status !== 'processing') return;
    const interval = setInterval(fetchRecords, 5000);
    return () => clearInterval(interval);
  }, [latestRecord?.status, fetchRecords]);

  const triggerLux = useCallback(async (entityData: any) => {
    if (!user || !entityId) return null;
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('lux-trigger', {
        body: { entityType, entityId, entityData },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success('🔮 Lux Intelligence ativado! Varredura em andamento...');
        await fetchRecords();
        return data.luxRecordId;
      } else {
        throw new Error(data?.error || 'Falha ao iniciar varredura');
      }
    } catch (err) {
      console.error('Error triggering Lux:', err);
      toast.error(`Erro ao ativar Lux: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      return null;
    } finally {
      setTriggering(false);
    }
  }, [user, entityType, entityId, fetchRecords]);

  return {
    records,
    latestRecord,
    loading,
    triggering,
    triggerLux,
    refresh: fetchRecords,
  };
}
