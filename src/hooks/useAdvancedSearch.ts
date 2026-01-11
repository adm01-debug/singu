import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface RecentItem {
  id: string;
  type: 'contact' | 'company' | 'interaction';
  name: string;
  subtitle?: string;
  path: string;
  timestamp: string;
  avatar_url?: string;
}

interface SearchResult {
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    avatar_url: string | null;
    company_name?: string;
  }>;
  companies: Array<{
    id: string;
    name: string;
    industry: string | null;
    logo_url: string | null;
  }>;
  interactions: Array<{
    id: string;
    title: string;
    type: string;
    contact_name?: string;
    created_at: string;
  }>;
}

const RECENT_STORAGE_KEY = 'relateiq_recent_items';
const MAX_RECENT_ITEMS = 10;

export function useAdvancedSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ contacts: [], companies: [], interactions: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent items:', error);
    }
  }, []);

  // Save recent item
  const addRecentItem = useCallback((item: Omit<RecentItem, 'timestamp'>) => {
    setRecentItems(prev => {
      // Remove if already exists
      const filtered = prev.filter(i => !(i.id === item.id && i.type === item.type));
      
      // Add to beginning
      const updated = [
        { ...item, timestamp: new Date().toISOString() },
        ...filtered
      ].slice(0, MAX_RECENT_ITEMS);

      // Persist
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Clear recent items
  const clearRecentItems = useCallback(() => {
    localStorage.removeItem(RECENT_STORAGE_KEY);
    setRecentItems([]);
  }, []);

  // Perform search
  const search = useCallback(async (searchQuery: string) => {
    if (!user || searchQuery.length < 2) {
      setResults({ contacts: [], companies: [], interactions: [] });
      return;
    }

    setIsSearching(true);
    
    try {
      const searchPattern = `%${searchQuery}%`;

      // Search in parallel
      const [contactsRes, companiesRes, interactionsRes] = await Promise.all([
        supabase
          .from('contacts')
          .select(`
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            company:companies(name)
          `)
          .eq('user_id', user.id)
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
          .limit(5),
        
        supabase
          .from('companies')
          .select('id, name, industry, logo_url')
          .eq('user_id', user.id)
          .or(`name.ilike.${searchPattern},industry.ilike.${searchPattern}`)
          .limit(5),
        
        supabase
          .from('interactions')
          .select(`
            id,
            title,
            type,
            created_at,
            contact:contacts(first_name, last_name)
          `)
          .eq('user_id', user.id)
          .or(`title.ilike.${searchPattern},content.ilike.${searchPattern}`)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setResults({
        contacts: (contactsRes.data || []).map(c => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          email: c.email,
          avatar_url: c.avatar_url,
          company_name: (c.company as { name: string } | null)?.name,
        })),
        companies: companiesRes.data || [],
        interactions: (interactionsRes.data || []).map(i => ({
          id: i.id,
          title: i.title,
          type: i.type,
          created_at: i.created_at,
          contact_name: i.contact 
            ? `${(i.contact as { first_name: string; last_name: string }).first_name} ${(i.contact as { first_name: string; last_name: string }).last_name}`
            : undefined,
        })),
      });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erro ao buscar');
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        search(query);
      }, 300);
    } else {
      setResults({ contacts: [], companies: [], interactions: [] });
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, search]);

  // Count total results
  const totalResults = results.contacts.length + results.companies.length + results.interactions.length;

  // Check if has results
  const hasResults = totalResults > 0;

  return {
    query,
    setQuery,
    results,
    isSearching,
    hasResults,
    totalResults,
    recentItems,
    addRecentItem,
    clearRecentItems,
    search,
  };
}
