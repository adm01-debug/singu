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

/** Fields that exist in the local Supabase schema but NOT in the external DB */
const LOCAL_ONLY_FIELDS = new Set([
  'name', 'industry', 'tags', 'phone', 'email', 'address',
  'city', 'state', 'instagram', 'linkedin', 'facebook',
  'youtube', 'twitter', 'tiktok',
]);

interface ExternalCompanyRow extends Record<string, unknown> {
  nome_crm?: string;
  nome_fantasia?: string;
  razao_social?: string;
  ramo_atividade?: string;
  tags_array?: string[];
}

interface CompaniesPage {
  companies: Company[];
  count: number;
}

function mapCompany(ext: ExternalCompanyRow): Company {
  return {
    ...ext,
    name: ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome',
    industry: ext.ramo_atividade || null,
    tags: ext.tags_array || [],
  } as Company;
}

function stripLocalFields(input: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!LOCAL_ONLY_FIELDS.has(key)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function fetchCompaniesPage(search?: string): Promise<CompaniesPage> {
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

  const { data, count, error } = await queryExternalData<ExternalCompanyRow>(options);
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
      const input = company as Record<string, unknown>;
      const externalFields = stripLocalFields(input);
      const record = { ...externalFields, user_id: user.id } as Record<string, unknown>;
      if (!record.nome_crm && input.name) record.nome_crm = input.name;

      const { data, error } = await insertExternalData<Company>('companies', record);
      if (error) throw error;
      if (data) {
        queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
          prev ? { ...prev, companies: [mapCompany(data as unknown as ExternalCompanyRow), ...prev.companies] } : { companies: [mapCompany(data as unknown as ExternalCompanyRow)], count: 1 }
        );
      }
      toast({ title: 'Empresa criada', description: `${(data as Record<string, unknown>)?.nome_crm || 'Empresa'} foi adicionada com sucesso.` });
      return data;
    } catch (error) {
      logger.error('Error creating company:', error);
      toast({ title: 'Erro ao criar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate) => {
    const previous = queryClient.getQueryData<CompaniesPage>(queryKey);
    queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
      prev ? { ...prev, companies: prev.companies.map(c => c.id === id ? { ...c, ...updates } as Company : c) } : prev
    );

    try {
      const input = updates as Record<string, unknown>;
      const cleanUpdates = stripLocalFields(input);
      delete cleanUpdates.id;
      const { data, error } = await updateExternalData<Company>('companies', id, cleanUpdates);
      if (error) throw error;
      if (data) {
        queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
          prev ? { ...prev, companies: prev.companies.map(c => c.id === id ? mapCompany(data as unknown as ExternalCompanyRow) : c) } : prev
        );
      }
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      return data;
    } catch (error) {
      if (previous) queryClient.setQueryData<CompaniesPage>(queryKey, previous);
      logger.error('Error updating company:', error);
      toast({ title: 'Erro ao atualizar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    const previous = queryClient.getQueryData<CompaniesPage>(queryKey);
    queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
      prev ? { ...prev, companies: prev.companies.filter(c => c.id !== id) } : prev
    );

    try {
      const { success, error } = await deleteExternalData('companies', id);
      if (error || !success) throw error || new Error('Delete failed');
      toast({ title: 'Empresa removida', description: 'A empresa foi excluída com sucesso.' });
      return true;
    } catch (error) {
      if (previous) queryClient.setQueryData<CompaniesPage>(queryKey, previous);
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
