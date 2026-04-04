import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData, insertExternalData, updateExternalData, deleteExternalData } from '@/lib/externalData';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Company = Tables<'companies'>;
export type CompanyInsert = TablesInsert<'companies'>;
export type CompanyUpdate = TablesUpdate<'companies'>;

function mapCompany(ext: any): Company {
  return {
    ...ext,
    name: ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome',
    industry: ext.ramo_atividade || null,
    tags: ext.tags_array || [],
  } as Company;
}

async function fetchCompaniesPage(search?: string) {
  const options: Parameters<typeof queryExternalData>[0] = {
    table: 'companies',
    order: { column: 'updated_at', ascending: false },
    range: { from: 0, to: 99 },
  };

  if (search && search.trim().length >= 2) {
    options.search = {
      term: search.trim(),
      columns: ['nome_crm', 'nome_fantasia', 'razao_social', 'ramo_atividade'],
    };
  }

  const { data, count, error } = await queryExternalData<any>(options);
  if (error) throw error;
  return { companies: (data || []).map(mapCompany), count: count || 0 };
}

export function useCompanies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const queryKey = ['companies', searchTerm || '__all__'];

  const { data, isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchCompaniesPage(searchTerm || undefined),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const companies = data?.companies ?? [];
  const totalCount = data?.count ?? 0;

  const fetchCompanies = useCallback(async (search?: string) => {
    if (search !== undefined) setSearchTerm(search);
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
  }, [queryClient]);

  const createCompany = async (company: Omit<CompanyInsert, 'user_id'>) => {
    if (!user) return null;
    try {
      // Strip fields that don't exist in the external DB
      const { name, industry, tags, phone, email, address, city, state, instagram, linkedin, facebook, youtube, twitter, tiktok, website: _website, ...externalFields } = company as any;
      const record = { ...externalFields, user_id: user.id };
      if (!record.nome_crm && name) record.nome_crm = name;

      const { data, error } = await insertExternalData<Company>('companies', record);
      if (error) throw error;
      if (data) queryClient.setQueryData(queryKey, (prev: any) => prev ? { ...prev, companies: [mapCompany(data), ...prev.companies] } : { companies: [mapCompany(data)], count: 1 });
      toast({ title: 'Empresa criada', description: `${data?.nome_crm || 'Empresa'} foi adicionada com sucesso.` });
      return data;
    } catch (error) {
      logger.error('Error creating company:', error);
      toast({ title: 'Erro ao criar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate) => {
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (prev: any) => prev ? { ...prev, companies: prev.companies.map((c: Company) => c.id === id ? { ...c, ...updates } as Company : c) } : prev);

    try {
      // Strip fields that don't exist in the external DB
      const { name, industry, tags, phone, email, address, city, state, instagram, linkedin, facebook, youtube, twitter, tiktok, id: _id, ...cleanUpdates } = updates as any;
      const { data, error } = await updateExternalData<Company>('companies', id, cleanUpdates);
      if (error) throw error;
      if (data) queryClient.setQueryData(queryKey, (prev: any) => prev ? { ...prev, companies: prev.companies.map((c: Company) => c.id === id ? mapCompany(data) : c) } : prev);
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      return data;
    } catch (error) {
      if (previous) queryClient.setQueryData(queryKey, previous);
      logger.error('Error updating company:', error);
      toast({ title: 'Erro ao atualizar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (prev: any) => prev ? { ...prev, companies: prev.companies.filter((c: Company) => c.id !== id) } : prev);

    try {
      const { success, error } = await deleteExternalData('companies', id);
      if (error || !success) throw error || new Error('Delete failed');
      toast({ title: 'Empresa removida', description: 'A empresa foi excluída com sucesso.' });
      return true;
    } catch (error) {
      if (previous) queryClient.setQueryData(queryKey, previous);
      logger.error('Error deleting company:', error);
      toast({ title: 'Erro ao excluir empresa', description: 'Não foi possível excluir a empresa.', variant: 'destructive' });
      return false;
    }
  };

  return {
    companies, loading, totalCount, searchTerm,
    setSearchTerm: (term: string) => { setSearchTerm(term); },
    fetchCompanies, createCompany, updateCompany, deleteCompany,
  };
}
