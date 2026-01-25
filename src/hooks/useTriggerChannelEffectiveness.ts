// ==============================================
// TRIGGER CHANNEL EFFECTIVENESS HOOK
// Tracks which triggers work best on each channel
// ==============================================

import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { AllTriggerTypes } from '@/types/triggers-advanced';

export type CommunicationChannel = 'whatsapp' | 'email' | 'call' | 'meeting' | 'linkedin' | 'sms';

export interface ChannelEffectiveness {
  id: string;
  user_id: string;
  contact_id: string | null;
  trigger_type: string;
  channel: CommunicationChannel;
  uses: number;
  successes: number;
  effectiveness_score: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordChannelUsageInput {
  trigger_type: AllTriggerTypes;
  channel: CommunicationChannel;
  contact_id?: string;
  success: boolean;
}

export interface ChannelRecommendation {
  channel: CommunicationChannel;
  score: number;
  uses: number;
  reason: string;
}

const CHANNEL_NAMES: Record<CommunicationChannel, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  call: 'Ligação',
  meeting: 'Reunião',
  linkedin: 'LinkedIn',
  sms: 'SMS',
};

export function useTriggerChannelEffectiveness(contactId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch effectiveness data
  const { data: effectivenessData, isLoading } = useQuery({
    queryKey: ['trigger-channel-effectiveness', user?.id, contactId],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('trigger_channel_effectiveness')
        .select('*')
        .eq('user_id', user.id);

      if (contactId) {
        query = query.or(`contact_id.eq.${contactId},contact_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ChannelEffectiveness[];
    },
    enabled: !!user?.id,
  });

  // Record channel usage
  const recordUsageMutation = useMutation({
    mutationFn: async (input: RecordChannelUsageInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Check if record exists
      let query = supabase
        .from('trigger_channel_effectiveness')
        .select('*')
        .eq('user_id', user.id)
        .eq('trigger_type', input.trigger_type)
        .eq('channel', input.channel);

      if (input.contact_id) {
        query = query.eq('contact_id', input.contact_id);
      } else {
        query = query.is('contact_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Update existing record
        const newUses = (existing.uses || 0) + 1;
        const newSuccesses = input.success 
          ? (existing.successes || 0) + 1 
          : (existing.successes || 0);
        const newScore = Math.round((newSuccesses / newUses) * 100);

        const { data, error } = await supabase
          .from('trigger_channel_effectiveness')
          .update({
            uses: newUses,
            successes: newSuccesses,
            effectiveness_score: newScore,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as ChannelEffectiveness;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('trigger_channel_effectiveness')
          .insert({
            user_id: user.id,
            contact_id: input.contact_id || null,
            trigger_type: input.trigger_type,
            channel: input.channel,
            uses: 1,
            successes: input.success ? 1 : 0,
            effectiveness_score: input.success ? 100 : 0,
            last_used_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data as ChannelEffectiveness;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trigger-channel-effectiveness'] });
    },
  });

  // Get best channel for a trigger
  const getBestChannelForTrigger = useCallback((
    triggerId: AllTriggerTypes
  ): ChannelRecommendation | null => {
    if (!effectivenessData) return null;

    const triggerData = effectivenessData.filter(d => d.trigger_type === triggerId);
    if (triggerData.length === 0) return null;

    // Sort by effectiveness score, then by uses for tie-breaking
    const sorted = triggerData.sort((a, b) => {
      if (b.effectiveness_score !== a.effectiveness_score) {
        return b.effectiveness_score - a.effectiveness_score;
      }
      return b.uses - a.uses;
    });

    const best = sorted[0];
    return {
      channel: best.channel,
      score: best.effectiveness_score,
      uses: best.uses,
      reason: `${CHANNEL_NAMES[best.channel]} tem ${best.effectiveness_score}% de sucesso com ${best.uses} usos`,
    };
  }, [effectivenessData]);

  // Get all channel recommendations for a trigger
  const getChannelRecommendations = useCallback((
    triggerId: AllTriggerTypes
  ): ChannelRecommendation[] => {
    if (!effectivenessData) return [];

    const triggerData = effectivenessData.filter(d => d.trigger_type === triggerId);
    
    return triggerData
      .map(d => ({
        channel: d.channel,
        score: d.effectiveness_score,
        uses: d.uses,
        reason: `${d.effectiveness_score}% sucesso em ${d.uses} usos`,
      }))
      .sort((a, b) => b.score - a.score);
  }, [effectivenessData]);

  // Get trigger effectiveness by channel summary
  const channelSummary = useMemo(() => {
    if (!effectivenessData) return {};

    const summary: Record<CommunicationChannel, {
      totalUses: number;
      avgScore: number;
      topTriggers: { trigger: string; score: number }[];
    }> = {} as Record<CommunicationChannel, { totalUses: number; avgScore: number; topTriggers: { trigger: string; score: number }[] }>;

    const channels: CommunicationChannel[] = ['whatsapp', 'email', 'call', 'meeting', 'linkedin', 'sms'];
    
    channels.forEach(channel => {
      const channelData = effectivenessData.filter(d => d.channel === channel);
      
      if (channelData.length === 0) {
        summary[channel] = { totalUses: 0, avgScore: 0, topTriggers: [] };
        return;
      }

      const totalUses = channelData.reduce((sum, d) => sum + d.uses, 0);
      const avgScore = Math.round(
        channelData.reduce((sum, d) => sum + d.effectiveness_score, 0) / channelData.length
      );
      const topTriggers = channelData
        .sort((a, b) => b.effectiveness_score - a.effectiveness_score)
        .slice(0, 3)
        .map(d => ({ trigger: d.trigger_type, score: d.effectiveness_score }));

      summary[channel] = { totalUses, avgScore, topTriggers };
    });

    return summary;
  }, [effectivenessData]);

  // Get overall best channels
  const bestChannelsOverall = useMemo(() => {
    if (!effectivenessData || effectivenessData.length === 0) return [];

    const channelScores = new Map<CommunicationChannel, { total: number; count: number }>();
    
    effectivenessData.forEach(d => {
      const existing = channelScores.get(d.channel) || { total: 0, count: 0 };
      channelScores.set(d.channel, {
        total: existing.total + d.effectiveness_score,
        count: existing.count + 1,
      });
    });

    return Array.from(channelScores.entries())
      .map(([channel, { total, count }]) => ({
        channel,
        avgScore: Math.round(total / count),
        name: CHANNEL_NAMES[channel],
      }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [effectivenessData]);

  return {
    effectivenessData: effectivenessData || [],
    isLoading,
    
    recordUsage: recordUsageMutation.mutate,
    isRecording: recordUsageMutation.isPending,
    
    getBestChannelForTrigger,
    getChannelRecommendations,
    channelSummary,
    bestChannelsOverall,
    
    CHANNEL_NAMES,
  };
}
