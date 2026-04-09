import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type DISCCommLog = Tables<'disc_communication_logs'>;

export function useDISCCommunicationLogs(contactId?: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DISCCommLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user || !contactId) return;
    try {
      const { data, error } = await supabase
        .from('disc_communication_logs')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      logger.error('Error fetching DISC comm logs:', err);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const logCommunication = useCallback(async (log: Omit<TablesInsert<'disc_communication_logs'>, 'user_id'>) => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('disc_communication_logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      setLogs(prev => [data, ...prev]);
      toast.success('Log de comunicação DISC registrado');
      return data;
    } catch (err) {
      logger.error('Error logging DISC communication:', err);
      toast.error('Erro ao registrar comunicação');
      return null;
    }
  }, [user]);

  const avgEffectiveness = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.effectiveness_rating || 0), 0) / logs.filter(l => l.effectiveness_rating).length)
    : null;

  const adaptationRate = logs.length > 0
    ? Math.round((logs.filter(l => l.approach_adapted).length / logs.length) * 100)
    : 0;

  return { logs, loading, logCommunication, avgEffectiveness, adaptationRate, refresh: fetchLogs };
}
