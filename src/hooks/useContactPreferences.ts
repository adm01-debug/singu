import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ContactPreference {
  id: string;
  user_id: string;
  contact_id: string;
  preferred_channel: string;
  preferred_days: string[];
  preferred_times: string[];
  avoid_days: string[];
  avoid_times: string[];
  restrictions: string | null;
  personal_notes: string | null;
  communication_tips: string | null;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const TIME_SLOTS = [
  { value: 'early_morning', label: '06h - 09h' },
  { value: 'morning', label: '09h - 12h' },
  { value: 'lunch', label: '12h - 14h' },
  { value: 'afternoon', label: '14h - 18h' },
  { value: 'evening', label: '18h - 21h' },
  { value: 'night', label: '21h - 23h' },
];

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'call', label: 'Ligação', icon: '📞' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'meeting', label: 'Presencial', icon: '🤝' },
  { value: 'video', label: 'Vídeo', icon: '📹' },
];

export function useContactPreferences(contactId?: string) {
  const { user } = useAuth();
  const [preference, setPreference] = useState<ContactPreference | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreference = useCallback(async () => {
    if (!user || !contactId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contact_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('contact_id', contactId)
        .maybeSingle();

      if (error) throw error;
      setPreference(data as ContactPreference | null);
    } catch (error) {
      logger.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user, contactId]);

  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  const savePreference = useCallback(async (data: Partial<ContactPreference>) => {
    if (!user || !contactId) return;

    try {
      const { error } = await supabase
        .from('contact_preferences')
        .upsert({
          user_id: user.id,
          contact_id: contactId,
          preferred_channel: data.preferred_channel || 'whatsapp',
          preferred_days: data.preferred_days || [],
          preferred_times: data.preferred_times || [],
          avoid_days: data.avoid_days || [],
          avoid_times: data.avoid_times || [],
          restrictions: data.restrictions || null,
          personal_notes: data.personal_notes || null,
          communication_tips: data.communication_tips || null,
        }, { onConflict: 'user_id,contact_id' });

      if (error) throw error;

      toast.success('Preferências salvas!');
      fetchPreference();
    } catch (error) {
      logger.error('Error saving preferences:', error);
      toast.error('Erro ao salvar preferências');
    }
  }, [user, contactId, fetchPreference]);

  const isGoodTimeToContact = useCallback(() => {
    if (!preference) return { canContact: true, reason: null };

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentHour = now.getHours();

    // Check avoided days
    if (preference.avoid_days.includes(currentDay)) {
      return { canContact: false, reason: `Evitar contato às ${DAYS_OF_WEEK.find(d => d.value === currentDay)?.label}s` };
    }

    // Check avoided times
    let currentTimeSlot = '';
    if (currentHour >= 6 && currentHour < 9) currentTimeSlot = 'early_morning';
    else if (currentHour >= 9 && currentHour < 12) currentTimeSlot = 'morning';
    else if (currentHour >= 12 && currentHour < 14) currentTimeSlot = 'lunch';
    else if (currentHour >= 14 && currentHour < 18) currentTimeSlot = 'afternoon';
    else if (currentHour >= 18 && currentHour < 21) currentTimeSlot = 'evening';
    else currentTimeSlot = 'night';

    if (preference.avoid_times.includes(currentTimeSlot)) {
      return { canContact: false, reason: `Evitar contato no horário ${TIME_SLOTS.find(t => t.value === currentTimeSlot)?.label}` };
    }

    // Check if this is a preferred time
    const isPreferredDay = preference.preferred_days.length === 0 || preference.preferred_days.includes(currentDay);
    const isPreferredTime = preference.preferred_times.length === 0 || preference.preferred_times.includes(currentTimeSlot);

    if (isPreferredDay && isPreferredTime) {
      return { canContact: true, reason: 'Horário ideal para contato! ✨', isIdeal: true };
    }

    return { canContact: true, reason: null };
  }, [preference]);

  return {
    preference,
    loading,
    savePreference,
    isGoodTimeToContact,
    constants: {
      DAYS_OF_WEEK,
      TIME_SLOTS,
      CHANNELS,
    },
    refresh: fetchPreference,
  };
}
