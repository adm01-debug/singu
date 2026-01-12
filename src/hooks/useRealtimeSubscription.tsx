import React, { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}

interface RealtimeSubscriptionOptions<T> {
  table: string;
  schema?: string;
  event?: EventType;
  filter?: string;
  onInsert?: (record: T) => void;
  onUpdate?: (record: T, oldRecord: T) => void;
  onDelete?: (oldRecord: T) => void;
  onChange?: (payload: RealtimePayload<T>) => void;
  enabled?: boolean;
}

export function useRealtimeSubscription<T extends Record<string, unknown>>({
  table,
  schema = 'public',
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: RealtimeSubscriptionOptions<T>) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleChange = useCallback((payload: RealtimePayload<T>) => {
    switch (payload.eventType) {
      case 'INSERT':
        if (onInsert && payload.new) {
          onInsert(payload.new);
        }
        break;
      case 'UPDATE':
        if (onUpdate && payload.new && payload.old) {
          onUpdate(payload.new, payload.old);
        }
        break;
      case 'DELETE':
        if (onDelete && payload.old) {
          onDelete(payload.old);
        }
        break;
    }
    if (onChange) {
      onChange(payload);
    }
  }, [onInsert, onUpdate, onDelete, onChange]);

  useEffect(() => {
    if (!enabled || !user) return;

    const channelName = `realtime-${table}-${user.id}-${Date.now()}`;
    const userFilter = filter || `user_id=eq.${user.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        { event, schema, table, filter: userFilter },
        handleChange as any
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, event, filter, enabled, user, handleChange]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  return { unsubscribe };
}

// Presence tracking hook
interface PresenceState {
  id: string;
  name?: string;
  avatar?: string;
  online_at: string;
}

export function usePresence(roomId: string, userInfo?: { name?: string; avatar?: string }) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [presenceState, setPresenceState] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(`presence-${roomId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const users = Object.values(state).flat();
        setPresenceState(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            name: userInfo?.name,
            avatar: userInfo?.avatar,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user, userInfo?.name, userInfo?.avatar]);

  return { presenceState };
}

export default useRealtimeSubscription;
