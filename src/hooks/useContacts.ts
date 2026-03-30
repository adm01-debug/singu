import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData, insertExternalData, updateExternalData, deleteExternalData } from '@/lib/externalData';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

export type ContactListItem = Pick<Contact, 
  | 'id' | 'first_name' | 'last_name' | 'email' | 'phone'
  | 'role' | 'role_title' | 'company_id' | 'relationship_score'
  | 'relationship_stage' | 'sentiment' | 'tags' | 'avatar_url'
  | 'updated_at' | 'created_at'
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
      logger.error('Error fetching contacts from external DB:', error);
      toast({ title: 'Erro ao carregar contatos', description: 'Tente novamente mais tarde.', variant: 'destructive' });
      return { data: [], count: 0, hasMore: false };
    } finally {
      setLoading(false);
    }
  }, [user, companyId, toast]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchContacts(page + 1, true);
  }, [hasMore, loading, page, fetchContacts]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const createContact = async (contact: Omit<ContactInsert, 'user_id'>) => {
    if (!user) return null;
    try {
      const { data, error } = await insertExternalData<Contact>('contacts', { ...contact, user_id: user.id });
      if (error) throw error;
      if (data) setContacts(prev => [data, ...prev]);
      toast({ title: 'Contato criado', description: `${data?.first_name} ${data?.last_name} foi adicionado com sucesso.` });
      return data;
    } catch (error) {
      logger.error('Error creating contact:', error);
      toast({ title: 'Erro ao criar contato', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate) => {
    let previousContact: Contact | undefined;
    setContacts(prev => prev.map(c => {
      if (c.id === id) { previousContact = c; return { ...c, ...updates } as Contact; }
      return c;
    }));

    try {
      const { data, error } = await updateExternalData<Contact>('contacts', id, updates);
      if (error) throw error;
      if (data) setContacts(prev => prev.map(c => c.id === id ? data : c));
      return data;
    } catch (error) {
      logger.error('Error updating contact:', error);
      if (previousContact) setContacts(prev => prev.map(c => c.id === id ? previousContact! : c));
      toast({ title: 'Erro ao atualizar contato', description: 'As alterações foram revertidas.', variant: 'destructive' });
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    let removedContact: Contact | undefined;
    setContacts(prev => { removedContact = prev.find(c => c.id === id); return prev.filter(c => c.id !== id); });

    try {
      const { success, error } = await deleteExternalData('contacts', id);
      if (error || !success) throw error || new Error('Delete failed');
      return true;
    } catch (error) {
      logger.error('Error deleting contact:', error);
      if (removedContact) setContacts(prev => [removedContact!, ...prev]);
      toast({ title: 'Erro ao excluir contato', description: 'Não foi possível excluir. O contato foi restaurado.', variant: 'destructive' });
      return false;
    }
  };

  return { contacts, loading, hasMore, fetchContacts, loadMore, createContact, updateContact, deleteContact };
}
