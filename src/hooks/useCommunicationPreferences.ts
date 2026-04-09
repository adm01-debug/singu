import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export function useCommunicationPreferences(contactId: string) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Tables<'communication_preferences'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !contactId) return;
    setLoading(true);

    supabase
      .from('communication_preferences')
      .select('*')
      .eq('contact_id', contactId)
      .limit(1)
      .then(({ data }) => {
        setPrefs(data?.[0] || null);
        setLoading(false);
      });
  }, [user, contactId]);

  const upsert = useCallback(async (updates: Partial<Tables<'communication_preferences'>>) => {
    if (!user) return;

    if (prefs) {
      const { error } = await supabase
        .from('communication_preferences')
        .update(updates)
        .eq('id', prefs.id);
      if (error) { toast.error('Erro ao salvar preferências'); return; }
      setPrefs(prev => prev ? { ...prev, ...updates } : prev);
    } else {
      const { data, error } = await supabase
        .from('communication_preferences')
        .insert({ contact_id: contactId, user_id: user.id, preferred_channel: 'email', ...updates })
        .select()
        .single();
      if (error) { toast.error('Erro ao criar preferências'); return; }
      setPrefs(data);
    }
    toast.success('Preferências salvas');
  }, [user, contactId, prefs]);

  return { prefs, loading, upsert };
}
