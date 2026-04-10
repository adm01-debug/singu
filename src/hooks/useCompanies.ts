import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { queryExternalData, insertExternalData, updateExternalData, deleteExternalData } from '@/lib/externalData';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Company = Tables<'companies'>;
export type CompanyInsert = TablesInsert<'companies'>;
export type CompanyUpdate = TablesUpdate<'companies'>;

/** Fields from the local Supabase schema that do NOT exist in the external DB */
const LOCAL_ONLY = new Set([
  'name', 'industry', 'tags', 'notes', 'phone', 'email', 'address',
  'city', 'state', 'instagram', 'linkedin', 'facebook',
  'youtube', 'twitter', 'tiktok',
]);

interface ExternalRow extends Record<string, unknown> {
  nome_crm?: string;
  nome_fantasia?: string;
  razao_social?: string;
  ramo_atividade?: string;
  tags_array?: string[];
}

interface CompaniesPage { companies: Company[]; count: number }

/** Extract city/state from nome_crm patterns like "PAC Xerém - RJ - Duque de Caxias/RJ" */
function extractLocationFromName(name: string): { city: string | null; state: string | null } {
  // Pattern: "... - City/UF" at end
  const slashMatch = name.match(/[-–—]\s*([^-–—/]+)\/([A-Z]{2})\s*$/);
  if (slashMatch) return { city: slashMatch[1].trim(), state: slashMatch[2] };
  // Pattern: "... - UF" at end (2-letter state)
  const ufMatch = name.match(/[-–—]\s*([A-Z]{2})\s*$/);
  if (ufMatch) return { city: null, state: ufMatch[1] };
  return { city: null, state: null };
}

function mapCompany(ext: ExternalRow): Company {
  const rawName = ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome';
  
  // Extract location from name when city/state are missing
  const extCity = ext.city as string | null;
  const extState = ext.state as string | null;
  let city = extCity || null;
  let state = extState || null;
  
  if (!city && !state) {
    const parsed = extractLocationFromName(rawName);
    city = parsed.city;
    state = parsed.state;
  }

  return {
    ...ext,
    name: rawName,
    industry: ext.ramo_atividade || ext.nicho_cliente as string || null,
    tags: ext.tags_array || [],
    city,
    state,
    capital_social: ext.capital_social as number | null ?? null,
    grupo_economico: ext.grupo_economico as string | null ?? null,
    nicho_cliente: ext.nicho_cliente as string | null ?? null,
    website: ext.website as string | null ?? null,
    situacao_rf: ext.situacao_rf as string | null ?? null,
    cnpj: ext.cnpj as string | null ?? null,
    razao_social: ext.razao_social as string | null ?? null,
    is_carrier: ext.is_carrier as boolean | null ?? false,
    is_supplier: ext.is_supplier as boolean | null ?? false,
    porte_rf: ext.porte_rf as string | null ?? null,
    data_fundacao: ext.data_fundacao as string | null ?? null,
    financial_health: ext.financial_health as string | null ?? null,
    annual_revenue: ext.annual_revenue as string | null ?? null,
    employee_count: ext.employee_count as string | null ?? null,
  } as Company;
}

function stripLocal(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!LOCAL_ONLY.has(k)) out[k] = v;
  }
  return out;
}

async function fetchCompaniesPage(search?: string): Promise<CompaniesPage> {
  const options: Parameters<typeof queryExternalData>[0] = {
    table: 'companies',
    order: { column: 'updated_at', ascending: false },
    range: { from: 0, to: 99 },
  };
  if (search && search.trim().length >= 2) {
    options.search = { term: search.trim(), columns: ['nome_crm', 'nome_fantasia', 'razao_social', 'ramo_atividade'] };
  }
  const { data, count, error } = await queryExternalData<ExternalRow>(options);
  if (error) throw error;
  return { companies: (data || []).map(mapCompany), count: count || 0 };
}

export function useCompanies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
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
      const ext = stripLocal(input);
      const record = { ...ext, user_id: user.id } as Record<string, unknown>;
      if (!record.nome_crm && input.name) record.nome_crm = input.name;

      const { data, error } = await insertExternalData<Company>('companies', record);
      if (error) throw error;
      if (data) {
        queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
          prev ? { ...prev, companies: [mapCompany(data as unknown as ExternalRow), ...prev.companies] } : { companies: [mapCompany(data as unknown as ExternalRow)], count: 1 }
        );
      }
      const companyName = (data as Record<string, unknown>)?.nome_crm || 'Empresa';
      toast({ title: 'Empresa criada', description: `${companyName} foi adicionada com sucesso.` });
      if (data) logActivity({ type: 'created', entityType: 'company', entityId: (data as Record<string, unknown>).id as string, entityName: String(companyName), description: 'Empresa criada' });
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
      const clean = stripLocal(input);
      delete clean.id;
      const { data, error } = await updateExternalData<Company>('companies', id, clean);
      if (error) throw error;
      if (data) {
        queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
          prev ? { ...prev, companies: prev.companies.map(c => c.id === id ? mapCompany(data as unknown as ExternalRow) : c) } : prev
        );
      }
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      if (data) logActivity({ type: 'updated', entityType: 'company', entityId: id, entityName: (data as Record<string, unknown>).nome_crm as string || 'Empresa', description: 'Empresa atualizada' });
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
      const deleted = previous?.companies.find(c => c.id === id);
      logActivity({ type: 'deleted', entityType: 'company', entityId: id, entityName: deleted?.name || undefined, description: 'Empresa excluída' });
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
