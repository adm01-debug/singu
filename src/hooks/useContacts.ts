import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Contact = Tables<'contacts'>;
export type ContactInsert = TablesInsert<'contacts'>;
export type ContactUpdate = TablesUpdate<'contacts'>;

export function useContacts(companyId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('contacts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: 'Erro ao carregar contatos',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, companyId, toast]);

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
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
