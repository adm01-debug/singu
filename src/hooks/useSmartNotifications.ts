import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SmartNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'alert' | 'insight' | 'reminder';
  title: string;
  description?: string;
  action_url?: string;
  contact_id?: string;
  contact_name?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  created_at: string;
  read: boolean;
  dismissed: boolean;
  expires_at?: string;
}

interface NotificationGroup {
  date: string;
  notifications: SmartNotification[];
}

export function useSmartNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch alerts
      const { data: alerts } = await supabase
        .from('alerts')
        .select(`
          id,
          type,
          title,
          description,
          action_url,
          contact_id,
          priority,
          created_at,
          dismissed,
          expires_at
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch insights
      const { data: insights } = await supabase
        .from('insights')
        .select(`
          id,
          category,
          title,
          description,
          contact_id,
          created_at,
          dismissed,
          expires_at
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(30);

      // Fetch health alerts
      const { data: healthAlerts } = await supabase
        .from('health_alerts')
        .select(`
          id,
          alert_type,
          title,
          description,
          contact_id,
          health_score,
          created_at,
          dismissed
        `)
        .eq('user_id', user.id)
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      // Transform and merge notifications
      const allNotifications: SmartNotification[] = [
        ...(alerts || []).map(a => ({
          id: a.id,
          type: (a.type === 'warning' ? 'warning' : a.type === 'error' ? 'error' : 'alert') as SmartNotification['type'],
          title: a.title,
          description: a.description || undefined,
          action_url: a.action_url || undefined,
          contact_id: a.contact_id || undefined,
          priority: (a.priority || 'medium') as SmartNotification['priority'],
          created_at: a.created_at,
          read: false,
          dismissed: a.dismissed || false,
          expires_at: a.expires_at || undefined,
        })),
        ...(insights || []).map(i => ({
          id: i.id,
          type: 'insight' as const,
          title: i.title,
          description: i.description || undefined,
          contact_id: i.contact_id || undefined,
          category: i.category,
          created_at: i.created_at,
          read: false,
          dismissed: i.dismissed || false,
          expires_at: i.expires_at || undefined,
        })),
        ...(healthAlerts || []).map(h => ({
          id: h.id,
          type: 'warning' as const,
          title: h.title,
          description: h.description || undefined,
          contact_id: h.contact_id || undefined,
          priority: h.health_score < 30 ? 'critical' as const : h.health_score < 50 ? 'high' as const : 'medium' as const,
          created_at: h.created_at,
          read: false,
          dismissed: h.dismissed || false,
        })),
      ];

      // Sort by date and priority
      allNotifications.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const dismissNotification = useCallback(async (notification: SmartNotification) => {
    try {
      // Determine which table to update based on notification type
      if (notification.type === 'insight') {
        await supabase.from('insights').update({ dismissed: true }).eq('id', notification.id);
      } else if (notification.type === 'warning' && notification.priority) {
        await supabase.from('health_alerts').update({ dismissed: true }).eq('id', notification.id);
      } else {
        await supabase.from('alerts').update({ dismissed: true }).eq('id', notification.id);
      }

      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast.error('Erro ao dispensar notificação');
    }
  }, []);

  const dismissAll = useCallback(async () => {
    if (!user) return;

    try {
      await Promise.all([
        supabase.from('alerts').update({ dismissed: true }).eq('user_id', user.id),
        supabase.from('insights').update({ dismissed: true }).eq('user_id', user.id),
        supabase.from('health_alerts').update({ dismissed: true }).eq('user_id', user.id),
      ]);

      setNotifications([]);
      setUnreadCount(0);
      toast.success('Todas as notificações foram dispensadas');
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
      toast.error('Erro ao dispensar notificações');
    }
  }, [user]);

  // Group notifications by date
  const groupedNotifications = useMemo((): NotificationGroup[] => {
    const groups: Record<string, SmartNotification[]> = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Ontem';
      } else {
        dateKey = date.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(notification);
    });

    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications,
    }));
  }, [notifications]);

  // Get high priority count
  const highPriorityCount = useMemo(() => 
    notifications.filter(n => n.priority === 'critical' || n.priority === 'high').length,
    [notifications]
  );

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send browser notification
  const sendBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        ...options,
      });
    }
  }, []);

  return {
    notifications,
    groupedNotifications,
    loading,
    unreadCount,
    highPriorityCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    requestPermission,
    sendBrowserNotification,
  };
}
