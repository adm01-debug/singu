import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface PendingNotification {
  id?: string;
  contact_id?: string;
  user_id?: string;
  notification_type?: string;
  title?: string;
  description?: string;
  priority?: string;
  due_at?: string;
  created_at?: string;
  contact_name?: string;
  company_name?: string;
}

export function usePendingNotifications(limit = 20) {
  return useQuery({
    queryKey: ['pending-notifications', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData<PendingNotification>({
        table: 'vw_pending_notifications',
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
