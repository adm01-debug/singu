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
  'youtube', 'twitter', 'tiktok', 'merge_notes',
]);

interface ExternalRow extends Record<string, unknown> {
  nome_crm?: string;
  nome_fantasia?: string;
  razao_social?: string;
  ramo_atividade?: string;
  tags_array?: string[];
  id?: string;
}

interface CompaniesPage { companies: Company[]; count: number }

const COMPANIES_PAGE_SIZE = 500;
const MAX_COMPANIES_TOTAL = 2000;
const COMPANY_SEARCH_COLUMNS = [
  'nome_crm',
  'nome_fantasia',
  'razao_social',
  'ramo_atividade',
  'nicho_cliente',
  'grupo_economico',
  'tipo_cooperativa',
  'cnpj',
] as const;

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
    // Dados fiscais/cadastrais
    capital_social: ext.capital_social as number | null ?? null,
    cnpj: ext.cnpj as string | null ?? null,
    cnpj_base: ext.cnpj_base as string | null ?? null,
    razao_social: ext.razao_social as string | null ?? null,
    situacao_rf: ext.situacao_rf as string | null ?? null,
    situacao_rf_data: ext.situacao_rf_data as string | null ?? null,
    porte_rf: ext.porte_rf as string | null ?? null,
    natureza_juridica: ext.natureza_juridica as string | null ?? null,
    natureza_juridica_desc: ext.natureza_juridica_desc as string | null ?? null,
    data_fundacao: ext.data_fundacao as string | null ?? null,
    inscricao_estadual: ext.inscricao_estadual as string | null ?? null,
    inscricao_municipal: ext.inscricao_municipal as string | null ?? null,
    // Classificação
    ramo_atividade: ext.ramo_atividade as string | null ?? null,
    nicho_cliente: ext.nicho_cliente as string | null ?? null,
    is_customer: ext.is_customer as boolean | null ?? false,
    is_carrier: ext.is_carrier as boolean | null ?? false,
    is_supplier: ext.is_supplier as boolean | null ?? false,
    is_matriz: ext.is_matriz as boolean | null ?? null,
    // Estrutura cooperativista / grupo
    grupo_economico: ext.grupo_economico as string | null ?? null,
    grupo_economico_id: ext.grupo_economico_id as string | null ?? null,
    tipo_cooperativa: ext.tipo_cooperativa as string | null ?? null,
    numero_cooperativa: ext.numero_cooperativa as string | null ?? null,
    matriz_id: ext.matriz_id as string | null ?? null,
    central_id: ext.central_id as string | null ?? null,
    singular_id: ext.singular_id as string | null ?? null,
    confederacao_id: ext.confederacao_id as string | null ?? null,
    // Outros
    website: ext.website as string | null ?? null,
    financial_health: ext.financial_health as string | null ?? null,
    annual_revenue: ext.annual_revenue as string | null ?? null,
    employee_count: ext.employee_count as string | null ?? null,
    status: ext.status as string | null ?? null,
    logo_url: ext.logo_url as string | null ?? null,
    bitrix_company_id: ext.bitrix_company_id as number | null ?? null,
    extra_data_rf: ext.extra_data_rf ?? null,
    cores_marca: ext.cores_marca as string | null ?? null,
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
  const buildOptions = (range: { from: number; to: number }): Parameters<typeof queryExternalData>[0] => ({
    table: 'companies',
    order: { column: 'updated_at', ascending: false },
    range,
    ...(search && search.trim().length >= 2
      ? {
          search: {
            term: search.trim(),
            columns: [...COMPANY_SEARCH_COLUMNS],
          },
        }
      : {}),
  });

  const fetchBatch = async (range: { from: number; to: number }) => {
    const { data, count, error } = await queryExternalData<ExternalRow>(buildOptions(range));
    if (error) throw error;
    return { rows: data || [], count: count || 0 };
  };

  const firstBatch = await fetchBatch({ from: 0, to: COMPANIES_PAGE_SIZE - 1 });
  const totalCount = firstBatch.count || firstBatch.rows.length;
  const cappedTotal = Math.min(totalCount, MAX_COMPANIES_TOTAL);

  let allRows = [...firstBatch.rows];

  if (cappedTotal > firstBatch.rows.length) {
    const pendingRanges: Array<{ from: number; to: number }> = [];
    for (let from = firstBatch.rows.length; from < cappedTotal; from += COMPANIES_PAGE_SIZE) {
      pendingRanges.push({
        from,
        to: Math.min(from + COMPANIES_PAGE_SIZE - 1, cappedTotal - 1),
      });
    }

    for (let index = 0; index < pendingRanges.length; index += 3) {
      const slice = pendingRanges.slice(index, index + 3);
      const batches = await Promise.all(slice.map((range) => fetchBatch(range)));
      allRows = allRows.concat(batches.flatMap((batch) => batch.rows));
    }
  }

  const seen = new Set<string>();
  const uniqueRows = allRows.filter((row) => {
    if (!row.id) return false;
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  return { companies: uniqueRows.map(mapCompany), count: totalCount };
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
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
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
          prev
            ? { ...prev, companies: [mapCompany(data as unknown as ExternalRow), ...prev.companies], count: prev.count + 1 }
            : { companies: [mapCompany(data as unknown as ExternalRow)], count: 1 }
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
      prev ? { ...prev, companies: prev.companies.filter(c => c.id !== id), count: Math.max(0, prev.count - 1) } : prev
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
