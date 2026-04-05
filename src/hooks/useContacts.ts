import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
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

const PAGE_SIZE = 50;

async function fetchContactsPage(companyId?: string) {
  const filters = companyId
    ? [{ type: 'eq' as const, column: 'company_id', value: companyId }]
    : undefined;

  const { data, error } = await queryExternalData<Contact>({
    table: 'contacts',
    order: { column: 'updated_at', ascending: false },
    range: { from: 0, to: PAGE_SIZE - 1 },
    filters,
  });

  if (error) throw error;
  return data || [];
}

export function useContacts(companyId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();

  const queryKey = ['contacts', companyId ?? '__all__'];

  const { data: contacts = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchContactsPage(companyId),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const fetchContacts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // loadMore / hasMore kept for API compat but simplified
  const hasMore = contacts.length >= PAGE_SIZE;
  const loadMore = useCallback(() => {
    // pagination can be added later if needed
  }, []);

  const createContact = async (contact: Omit<ContactInsert, 'user_id'>) => {
    if (!user) return null;
    try {
      // Strip local-only fields that don't exist in the external DB
      const { tags, interests, hobbies, twitter, avatar_url, family_info, ...externalFields } = contact as Record<string, unknown>;
      const { data, error } = await insertExternalData<Contact>('contacts', { ...externalFields, user_id: user.id });
      if (error) throw error;
      if (data) queryClient.setQueryData<Contact[]>(queryKey, prev => prev ? [data, ...prev] : [data]);
      toast({ title: 'Contato criado', description: `${data?.first_name} ${data?.last_name} foi adicionado com sucesso.` });
      if (data) logActivity({ type: 'created', entityType: 'contact', entityId: data.id, entityName: `${data.first_name} ${data.last_name}`.trim(), description: 'Contato criado' });
      return data;
    } catch (error) {
      logger.error('Error creating contact:', error);
      toast({ title: 'Erro ao criar contato', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate) => {
    const previous = queryClient.getQueryData<Contact[]>(queryKey);
    queryClient.setQueryData<Contact[]>(queryKey, prev =>
      prev?.map(c => c.id === id ? { ...c, ...updates } as Contact : c) ?? []
    );

    try {
      // Strip local-only fields
      const { tags, interests, hobbies, twitter, avatar_url, family_info, id: _id, ...cleanUpdates } = updates as Record<string, unknown>;
      const { data, error } = await updateExternalData<Contact>('contacts', id, cleanUpdates);
      if (error) throw error;
      if (data) queryClient.setQueryData<Contact[]>(queryKey, prev =>
        prev?.map(c => c.id === id ? data : c) ?? []
      );
      return data;
    } catch (error) {
      logger.error('Error updating contact:', error);
      if (previous) queryClient.setQueryData<Contact[]>(queryKey, previous);
      toast({ title: 'Erro ao atualizar contato', description: 'As alterações foram revertidas.', variant: 'destructive' });
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    const previous = queryClient.getQueryData<Contact[]>(queryKey);
    queryClient.setQueryData<Contact[]>(queryKey, prev => prev?.filter(c => c.id !== id) ?? []);

    try {
      const { success, error } = await deleteExternalData('contacts', id);
      if (error || !success) throw error || new Error('Delete failed');
      return true;
    } catch (error) {
      logger.error('Error deleting contact:', error);
      if (previous) queryClient.setQueryData<Contact[]>(queryKey, previous);
      toast({ title: 'Erro ao excluir contato', description: 'Não foi possível excluir. O contato foi restaurado.', variant: 'destructive' });
      return false;
    }
  };

  return { contacts, loading, hasMore, fetchContacts, loadMore, createContact, updateContact, deleteContact };
}
