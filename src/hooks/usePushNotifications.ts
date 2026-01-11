import { useState, useEffect, useCallback } from 'react';
import { 
  isPushSupported, 
  subscribeToPush, 
  unsubscribeFromPush, 
  getSubscriptionStatus,
  registerServiceWorker 
} from '@/lib/pushNotifications';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  showLocalNotification: (title: string, options?: NotificationOptions) => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      // Check support
      const supported = isPushSupported();
      setIsSupported(supported);

      // Check permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      // Check subscription status
      if (supported) {
        const { isSubscribed: subscribed } = await getSubscriptionStatus();
        setIsSubscribed(subscribed);
      }

      setIsLoading(false);
    };

    init();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      // Ensure permission is granted
      if (permission === 'default') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          setIsLoading(false);
          return false;
        }
      } else if (permission === 'denied') {
        setIsLoading(false);
        return false;
      }

      // Register service worker and subscribe
      const subscription = await subscribeToPush();
      const success = !!subscription;
      setIsSubscribed(success);
      return success;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Show a local notification (useful for testing or in-app notifications)
  const showLocalNotification = useCallback((
    title: string, 
    options?: NotificationOptions
  ) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      console.warn('Notifications not permitted');
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    };

    // Use service worker if available for persistence
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, defaultOptions);
      });
    } else {
      // Fallback to basic notification
      new Notification(title, defaultOptions);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    requestPermission,
    showLocalNotification,
  };
}

export default usePushNotifications;
