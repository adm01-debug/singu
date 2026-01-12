import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationCounts {
  notifications: number;
  insights: number;
  healthAlerts: number;
  interactions: number;
  total: number;
}

export function useNotificationCounts() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    notifications: 0,
    insights: 0,
    healthAlerts: 0,
    interactions: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchCounts = useCallback(async () => {
    if (!user?.id) {
      setCounts({ notifications: 0, insights: 0, healthAlerts: 0, interactions: 0, total: 0 });
      setIsLoading(false);
      return;
    }

    try {
      // Fetch counts in parallel
      const [alertsResult, insightsResult, healthResult, interactionsResult] = await Promise.all([
        supabase
          .from('alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('dismissed', false),
        supabase
          .from('insights')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('dismissed', false),
        supabase
          .from('health_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('dismissed', false),
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('follow_up_required', true)
          .lte('follow_up_date', new Date().toISOString().split('T')[0]),
      ]);

      const notifications = alertsResult.count || 0;
      const insights = insightsResult.count || 0;
      const healthAlerts = healthResult.count || 0;
      const interactions = interactionsResult.count || 0;

      setCounts({
        notifications,
        insights,
        healthAlerts,
        interactions,
        total: notifications + insights + healthAlerts + interactions,
      });
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch on mount and set up realtime subscription
  useEffect(() => {
    fetchCounts();

    if (!user?.id) return;

    // Subscribe to changes in alerts table
    const alertsChannel = supabase
      .channel('notification-counts-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCounts()
      )
      .subscribe();

    // Subscribe to changes in insights table
    const insightsChannel = supabase
      .channel('notification-counts-insights')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insights',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCounts()
      )
      .subscribe();

    // Subscribe to changes in health_alerts table
    const healthChannel = supabase
      .channel('notification-counts-health')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(insightsChannel);
      supabase.removeChannel(healthChannel);
    };
  }, [user?.id, fetchCounts]);

  return {
    counts,
    isLoading,
    refetch: fetchCounts,
  };
}
