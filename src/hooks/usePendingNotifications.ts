import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface PendingNotification {
  id?: string;
  contact_id?: string;
  contact_name?: string;
  type?: string;
  title?: string;
  description?: string;
  priority?: string;
  due_at?: string;
  created_at?: string;
  [key: string]: unknown;
}

export function usePendingNotifications(limit = 50) {
  return useQuery({
    queryKey: ['vw-pending-notifications', limit],
    queryFn: async () => {
      const { data, error } = await queryExternalData<PendingNotification>({
        table: 'vw_pending_notifications',
        select: '*',
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
