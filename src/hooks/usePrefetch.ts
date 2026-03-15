import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useRef } from 'react';

export function usePrefetch() {
  const queryClient = useQueryClient();
  const prefetchedIds = useRef(new Set<string>());

  const prefetchContact = useCallback((contactId: string) => {
    // Evitar prefetch duplicado
    if (prefetchedIds.current.has(`contact-${contactId}`)) return;
    prefetchedIds.current.add(`contact-${contactId}`);

    queryClient.prefetchQuery({
      queryKey: ['contact-detail', contactId],
      queryFn: async () => {
        const { data } = await supabase
          .from('contacts')
          .select(`
            *,
            company:companies(id, name, industry, logo_url),
            interactions:interactions(id, title, type, created_at, sentiment)
          `)
          .eq('id', contactId)
          .maybeSingle();
        return data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutos
    });
  }, [queryClient]);

  const prefetchCompany = useCallback((companyId: string) => {
    if (prefetchedIds.current.has(`company-${companyId}`)) return;
    prefetchedIds.current.add(`company-${companyId}`);

    queryClient.prefetchQuery({
      queryKey: ['company-detail', companyId],
      queryFn: async () => {
        const { data } = await supabase
          .from('companies')
          .select(`
            *,
            contacts:contacts(id, first_name, last_name, role, avatar_url)
          `)
          .eq('id', companyId)
          .single();
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const prefetchInteractions = useCallback((contactId: string) => {
    if (prefetchedIds.current.has(`interactions-${contactId}`)) return;
    prefetchedIds.current.add(`interactions-${contactId}`);

    queryClient.prefetchQuery({
      queryKey: ['interactions', contactId],
      queryFn: async () => {
        const { data } = await supabase
          .from('interactions')
          .select('*')
          .eq('contact_id', contactId)
          .order('created_at', { ascending: false })
          .limit(20);
        return data;
      },
      staleTime: 2 * 60 * 1000,
    });
  }, [queryClient]);

  const clearPrefetchCache = useCallback(() => {
    prefetchedIds.current.clear();
  }, []);

  return { 
    prefetchContact, 
    prefetchCompany, 
    prefetchInteractions,
    clearPrefetchCache 
  };
}

// Hook for prefetching on hover with delay
export function usePrefetchOnHover(
  prefetchFn: () => void,
  delay: number = 150
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const onMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(prefetchFn, delay);
  }, [prefetchFn, delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}
