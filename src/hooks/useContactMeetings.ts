import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactMeeting {
  id: string;
  contact_id: string;
  title: string;
  description?: string;
  meeting_type?: string;
  status?: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  location?: string;
  meeting_url?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export function useContactMeetings(contactId?: string) {
  return useQuery({
    queryKey: ['contact-meetings', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactMeeting>({
        table: 'meetings',
        select: '*',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
  });
}
