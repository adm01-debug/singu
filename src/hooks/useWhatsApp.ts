import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ========================
// TYPES
// ========================
interface WhatsAppInstance {
  id: string;
  instanceName: string;
  displayName?: string;
  status: string;
  phoneNumber?: string;
  profilePicUrl?: string;
  ownerJid?: string;
}

interface WhatsAppMessage {
  id: string;
  user_id: string;
  contact_id: string | null;
  instance_name: string;
  remote_jid: string;
  message_id: string | null;
  from_me: boolean;
  message_type: string;
  content: string | null;
  status: string | null;
  sender_name: string | null;
  timestamp: string;
  delivered_at: string | null;
  read_at: string | null;
  metadata: Record<string, any>;
}

interface WhatsAppChat {
  id: string;
  remoteJid: string;
  name?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTimestamp?: number;
  profilePicUrl?: string;
}

// ========================
// API CALLER
// ========================
async function callEvolutionApi(action: string, params: Record<string, any> = {}) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/functions/v1/evolution-api`;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...params }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Evolution API error');
  }

  return result.data;
}

// ========================
// HOOK
// ========================
export function useWhatsApp() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ---- Instances ----
  const instancesQuery = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: () => callEvolutionApi('list-instances'),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const instanceInfoQuery = useCallback(async (instanceName: string) => {
    return callEvolutionApi('instance-info', { instanceName });
  }, []);

  const createInstance = useMutation({
    mutationFn: async ({ instanceName, webhook, ...extra }: { instanceName: string; webhook?: any; [key: string]: any }) => {
      const result = await callEvolutionApi('create-instance', {
        instanceName,
        body: { webhook, ...extra },
      });

      // Save to local DB
      if (user) {
        await supabase.from('whatsapp_instances' as any).insert({
          user_id: user.id,
          instance_name: instanceName,
          display_name: instanceName,
          status: 'connecting',
          webhook_url: webhook?.url,
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Instância criada com sucesso!');
    },
    onError: (err: Error) => toast.error(`Erro ao criar instância: ${err.message}`),
  });

  const connectInstance = useMutation({
    mutationFn: (instanceName: string) => callEvolutionApi('connect-instance', { instanceName }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] }),
  });

  const restartInstance = useMutation({
    mutationFn: (instanceName: string) => callEvolutionApi('restart-instance', { instanceName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Instância reiniciada!');
    },
  });

  const logoutInstance = useMutation({
    mutationFn: async (instanceName: string) => {
      await callEvolutionApi('logout-instance', { instanceName });
      if (user) {
        await supabase.from('whatsapp_instances' as any).update({ status: 'disconnected' }).eq('instance_name', instanceName).eq('user_id', user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Instância desconectada!');
    },
  });

  const deleteInstance = useMutation({
    mutationFn: async (instanceName: string) => {
      await callEvolutionApi('delete-instance', { instanceName });
      if (user) {
        await supabase.from('whatsapp_instances' as any).delete().eq('instance_name', instanceName).eq('user_id', user.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-instances'] });
      toast.success('Instância excluída!');
    },
  });

  // ---- Messaging ----
  const sendMessage = useMutation({
    mutationFn: async ({ instanceName, remoteJid, message, ...extra }: {
      instanceName: string; remoteJid: string; message: string; [key: string]: any;
    }) => {
      return callEvolutionApi('send-message', { instanceName, remoteJid, message, body: extra });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
    },
  });

  const sendMedia = useMutation({
    mutationFn: ({ instanceName, ...body }: { instanceName: string; number: string; mediatype: string; media: string; caption?: string; [key: string]: any }) => {
      return callEvolutionApi('send-media', { instanceName, body });
    },
  });

  const sendReaction = useMutation({
    mutationFn: ({ instanceName, ...body }: { instanceName: string; key: any; reaction: string }) => {
      return callEvolutionApi('send-reaction', { instanceName, body });
    },
  });

  // ---- Chats ----
  const fetchChats = useCallback(async (instanceName: string) => {
    return callEvolutionApi('fetch-chats', { instanceName });
  }, []);

  const fetchMessages = useCallback(async (instanceName: string, remoteJid?: string, limit = 50) => {
    return callEvolutionApi('fetch-messages', { instanceName, remoteJid, limit });
  }, []);

  const checkNumber = useCallback(async (instanceName: string, phoneNumber: string | string[]) => {
    return callEvolutionApi('check-number', { instanceName, phoneNumber });
  }, []);

  const markAsRead = useMutation({
    mutationFn: ({ instanceName, ...body }: { instanceName: string; readMessages: any[] }) => {
      return callEvolutionApi('mark-read', { instanceName, body });
    },
  });

  // ---- Groups ----
  const fetchGroups = useCallback(async (instanceName: string) => {
    return callEvolutionApi('list-groups', { instanceName });
  }, []);

  const fetchGroupInfo = useCallback(async (instanceName: string, groupJid: string) => {
    return callEvolutionApi('group-info', { instanceName, body: { groupJid } });
  }, []);

  // ---- Profile ----
  const fetchProfile = useCallback(async (instanceName: string) => {
    return callEvolutionApi('fetch-profile', { instanceName });
  }, []);

  const fetchProfilePicture = useCallback(async (instanceName: string, number?: string) => {
    return callEvolutionApi('fetch-profile-picture', { instanceName, body: { number } });
  }, []);

  // ---- Labels ----
  const fetchLabels = useCallback(async (instanceName: string) => {
    return callEvolutionApi('list-labels', { instanceName });
  }, []);

  // ---- Settings ----
  const setSettings = useMutation({
    mutationFn: ({ instanceName, ...settings }: { instanceName: string; [key: string]: any }) => {
      return callEvolutionApi('set-settings', { instanceName, body: settings });
    },
    onSuccess: () => toast.success('Configurações salvas!'),
  });

  // ---- Webhook Config ----
  const configureWebhook = useMutation({
    mutationFn: ({ instanceName, url, events }: { instanceName: string; url: string; events?: string[] }) => {
      return callEvolutionApi('set-webhook', {
        instanceName,
        body: {
          enabled: true,
          url,
          webhookByEvents: false,
          webhookBase64: false,
          events: events || [
            'MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE',
            'SEND_MESSAGE', 'CONTACTS_UPSERT', 'PRESENCE_UPDATE', 'CALL',
          ],
        },
      });
    },
    onSuccess: () => toast.success('Webhook configurado!'),
  });

  // ---- Local Messages (from DB) ----
  const localMessagesQuery = (contactId?: string) => useQuery({
    queryKey: ['whatsapp-messages', contactId],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_messages' as any)
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (contactId) {
        query = query.eq('contact_id', contactId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WhatsAppMessage[];
    },
    enabled: !!user,
  });

  // ---- Local Instances (from DB) ----
  const localInstancesQuery = useQuery({
    queryKey: ['whatsapp-local-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_instances' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    // Instances
    instances: instancesQuery.data,
    instancesLoading: instancesQuery.isLoading,
    localInstances: localInstancesQuery.data,
    getInstanceInfo: instanceInfoQuery,
    createInstance,
    connectInstance,
    restartInstance,
    logoutInstance,
    deleteInstance,

    // Messaging
    sendMessage,
    sendMedia,
    sendReaction,

    // Chats
    fetchChats,
    fetchMessages,
    checkNumber,
    markAsRead,

    // Groups
    fetchGroups,
    fetchGroupInfo,

    // Profile
    fetchProfile,
    fetchProfilePicture,

    // Labels
    fetchLabels,

    // Settings
    setSettings,
    configureWebhook,

    // Local data
    getLocalMessages: localMessagesQuery,

    // Raw API call for custom actions
    callApi: callEvolutionApi,
  };
}
