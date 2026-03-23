import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { logger } from "@/lib/logger";

export interface FavoriteTemplate {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

export function useFavoriteTemplates() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorite_templates')
        .select('template_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(new Set(data?.map(f => f.template_id) || []));
    } catch (error) {
      logger.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (templateId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_templates')
        .insert({
          user_id: user.id,
          template_id: templateId,
        });

      if (error) throw error;

      setFavorites(prev => new Set([...prev, templateId]));
      return true;
    } catch (error) {
      logger.error('Error adding favorite:', error);
      return false;
    }
  };

  const removeFavorite = async (templateId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_templates')
        .delete()
        .eq('user_id', user.id)
        .eq('template_id', templateId);

      if (error) throw error;

      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(templateId);
        return next;
      });
      return true;
    } catch (error) {
      logger.error('Error removing favorite:', error);
      return false;
    }
  };

  const toggleFavorite = async (templateId: string): Promise<boolean> => {
    if (favorites.has(templateId)) {
      return removeFavorite(templateId);
    } else {
      return addFavorite(templateId);
    }
  };

  const isFavorite = (templateId: string): boolean => {
    return favorites.has(templateId);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
