import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData } from '@/lib/externalData';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

// Tipo para listagem otimizada (campos essenciais)
export type ContactListItem = Pick<Contact, 
  | 'id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'role'
  | 'role_title'
  | 'company_id'
  | 'relationship_score'
  | 'relationship_stage'
  | 'sentiment'
  | 'tags'
  | 'avatar_url'
  | 'updated_at'
  | 'created_at'
>;

export function useContacts(companyId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchContacts = useCallback(async (pageNum = 0, append = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Buscar do banco externo (somente leitura)
      const filters = companyId 
        ? [{ type: 'eq' as const, column: 'company_id', value: companyId }] 
        : undefined;

      const { data, count, error } = await queryExternalData<Contact>({
        table: 'contacts',
        order: { column: 'updated_at', ascending: false },
        range: { from: pageNum * pageSize, to: (pageNum + 1) * pageSize - 1 },
        filters,
      });

      if (error) throw error;
      
      if (append) {
        setContacts(prev => [...prev, ...(data || [])]);
      } else {
        setContacts(data || []);
      }
      
      setHasMore((data?.length || 0) === pageSize);
      setPage(pageNum);
      
      return { data, count, hasMore: (data?.length || 0) === pageSize };
    } catch (error) {
      console.error('Error fetching contacts from external DB:', error);
      toast({
        title: 'Erro ao carregar contatos',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return { data: [], count: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  }, [user, companyId, toast]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchContacts(page + 1, true);
    }
  }, [hasMore, loading, page, fetchContacts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = async (contact: Omit<ContactInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...contact, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => [data, ...prev]);
      toast({
        title: 'Contato criado',
        description: `${data.first_name} ${data.last_name} foi adicionado com sucesso.`,
      });
      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Erro ao criar contato',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setContacts(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: 'Contato atualizado',
        description: 'As alterações foram salvas.',
      });
      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: 'Erro ao atualizar contato',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setContacts(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Contato removido',
        description: 'O contato foi excluído com sucesso.',
      });
      return true;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: 'Erro ao excluir contato',
        description: 'Não foi possível excluir o contato.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    contacts,
    loading,
    hasMore,
    fetchContacts,
    loadMore,
    createContact,
    updateContact,
    deleteContact,
  };
}
