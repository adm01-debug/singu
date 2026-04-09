import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useWhatsAppData(contactId?: string) {
  const { user } = useAuth();
  const [instances, setInstances] = useState<Tables<'whatsapp_instances'>[]>([]);
  const [messages, setMessages] = useState<Tables<'whatsapp_messages'>[]>([]);
  const [kpis, setKpis] = useState<Tables<'whatsapp_kpis'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchAll = async () => {
      const [instRes, kpiRes, msgRes] = await Promise.all([
        supabase.from('whatsapp_instances').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_kpis').select('*').order('created_at', { ascending: false }).limit(1),
        contactId
          ? supabase.from('whatsapp_messages').select('*').eq('contact_id', contactId).order('timestamp', { ascending: false }).limit(50)
          : supabase.from('whatsapp_messages').select('*').order('timestamp', { ascending: false }).limit(50),
      ]);

      setInstances(instRes.data || []);
      setKpis(kpiRes.data?.[0] || null);
      setMessages(msgRes.data || []);
      setLoading(false);
    };

    fetchAll();
  }, [user, contactId]);

  return { instances, messages, kpis, loading };
}
