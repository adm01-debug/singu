import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export type ScoreType = 'closing' | 'health' | 'churn' | 'relationship' | 'satisfaction';

export interface ScoreRecord {
  id: string;
  contact_id: string;
  user_id: string;
  score_type: ScoreType;
  score_value: number;
  previous_value: number | null;
  factors: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  calculated_at: string;
  created_at: string;
}

export interface ScoreHistoryStats {
  current: number;
  previous: number | null;
  change: number;
  trend: 'up' | 'down' | 'stable';
  average30Days: number;
  min30Days: number;
  max30Days: number;
}

export function useScoreHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Salvar um novo score
  const saveScore = useCallback(async (
    contactId: string,
    scoreType: ScoreType,
    scoreValue: number,
    factors?: Json,
    metadata?: Json
  ): Promise<ScoreRecord | null> => {
    if (!user) return null;

    setLoading(true);
    try {
      // Buscar score anterior
      const { data: previousScore } = await supabase
        .from('score_history')
        .select('score_value')
        .eq('contact_id', contactId)
        .eq('score_type', scoreType)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Inserir novo score
      const { data, error } = await supabase
        .from('score_history')
        .insert([{
          contact_id: contactId,
          user_id: user.id,
          score_type: scoreType,
          score_value: scoreValue,
          previous_value: previousScore?.score_value ?? null,
          factors: factors ?? null,
          metadata: metadata ?? null,
        }])
        .select()
        .single();

      if (error) throw error;

      return data as ScoreRecord;
    } catch (error) {
      console.error('Error saving score:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Buscar histórico de scores
  const getScoreHistory = useCallback(async (
    contactId: string,
    scoreType: ScoreType,
    limit = 30
  ): Promise<ScoreRecord[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('score_history')
        .select('*')
        .eq('contact_id', contactId)
        .eq('score_type', scoreType)
        .order('calculated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data as ScoreRecord[]) || [];
    } catch (error) {
      console.error('Error fetching score history:', error);
      return [];
    }
  }, [user]);

  // Buscar último score
  const getLatestScore = useCallback(async (
    contactId: string,
    scoreType: ScoreType
  ): Promise<ScoreRecord | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('score_history')
        .select('*')
        .eq('contact_id', contactId)
        .eq('score_type', scoreType)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data as ScoreRecord | null;
    } catch (error) {
      console.error('Error fetching latest score:', error);
      return null;
    }
  }, [user]);

  // Obter estatísticas de score
  const getScoreStats = useCallback(async (
    contactId: string,
    scoreType: ScoreType
  ): Promise<ScoreHistoryStats | null> => {
    if (!user) return null;

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('score_history')
        .select('score_value, previous_value, calculated_at')
        .eq('contact_id', contactId)
        .eq('score_type', scoreType)
        .gte('calculated_at', thirtyDaysAgo.toISOString())
        .order('calculated_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const scores = data.map(d => d.score_value);
      const current = scores[0];
      const previous = data[0].previous_value;
      const change = previous ? current - previous : 0;

      return {
        current,
        previous,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        average30Days: scores.reduce((a, b) => a + b, 0) / scores.length,
        min30Days: Math.min(...scores),
        max30Days: Math.max(...scores),
      };
    } catch (error) {
      console.error('Error calculating score stats:', error);
      return null;
    }
  }, [user]);

  // Buscar todos os últimos scores de um contato
  const getAllLatestScores = useCallback(async (
    contactId: string
  ): Promise<Record<ScoreType, ScoreRecord | null>> => {
    if (!user) {
      return {
        closing: null,
        health: null,
        churn: null,
        relationship: null,
        satisfaction: null,
      };
    }

    const scoreTypes: ScoreType[] = ['closing', 'health', 'churn', 'relationship', 'satisfaction'];
    const results: Record<ScoreType, ScoreRecord | null> = {
      closing: null,
      health: null,
      churn: null,
      relationship: null,
      satisfaction: null,
    };

    try {
      // Buscar último de cada tipo em paralelo
      const promises = scoreTypes.map(type => 
        supabase
          .from('score_history')
          .select('*')
          .eq('contact_id', contactId)
          .eq('score_type', type)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        if (!response.error && response.data) {
          results[scoreTypes[index]] = response.data as ScoreRecord;
        }
      });

      return results;
    } catch (error) {
      console.error('Error fetching all latest scores:', error);
      return results;
    }
  }, [user]);

  // Limpar scores antigos (manutenção)
  const cleanupOldScores = useCallback(async (
    daysToKeep = 90
  ): Promise<number> => {
    if (!user) return 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('score_history')
        .delete()
        .eq('user_id', user.id)
        .lt('calculated_at', cutoffDate.toISOString())
        .select('id');

      if (error) throw error;

      const deletedCount = data?.length || 0;
      
      if (deletedCount > 0) {
        toast({
          title: 'Limpeza concluída',
          description: `${deletedCount} registros antigos removidos.`,
        });
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old scores:', error);
      return 0;
    }
  }, [user, toast]);

  return {
    loading,
    saveScore,
    getScoreHistory,
    getLatestScore,
    getScoreStats,
    getAllLatestScores,
    cleanupOldScores,
  };
}
