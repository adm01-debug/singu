import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useScoreHistory(contactId: string) {
  const { user } = useAuth();
  const [history, setHistory] = useState<Tables<'score_history'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !contactId) return;
    setLoading(true);

    supabase
      .from('score_history')
      .select('*')
      .eq('contact_id', contactId)
      .order('calculated_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setHistory(data || []);
        setLoading(false);
      });
  }, [user, contactId]);

  return { history, loading };
}
