import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface PendingNotification {
  id: string;
  user_id: string;
  notification_type: string | null;
  category: string | null;
  priority: string | null;
  title: string;
  message: string | null;
  icon: string | null;
  contact_id: string | null;
  contact_name: string | null;
  company_id: string | null;
  company_name: string | null;
  action_url: string | null;
  action_label: string | null;
  scheduled_for: string | null;
  created_at: string;
  hours_ago: number | null;
  priority_icon: string | null;
  type_label: string | null;
}

export function usePendingNotifications() {
  return useQuery({
    queryKey: ['pending-notifications'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<PendingNotification>({
        table: 'vw_pending_notifications',
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 19 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
