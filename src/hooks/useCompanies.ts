import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData } from '@/lib/externalData';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Company = Tables<'companies'>;
export type CompanyInsert = TablesInsert<'companies'>;
export type CompanyUpdate = TablesUpdate<'companies'>;

export function useCompanies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchCompanies = useCallback(async (search?: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const options: Parameters<typeof queryExternalData>[0] = {
        table: 'companies',
        order: { column: 'updated_at', ascending: false },
        range: { from: 0, to: 99 },
      };

      // Server-side search across multiple columns
      if (search && search.trim().length >= 2) {
        options.search = {
          term: search.trim(),
          columns: ['nome_crm', 'nome_fantasia', 'razao_social', 'ramo_atividade'],
        };
      }

      const { data, count, error } = await queryExternalData<any>(options);

      if (error) throw error;
      
      // Map external DB fields to expected Company shape
      const mapped = (data || []).map((ext: any) => ({
        ...ext,
        name: ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome',
        industry: ext.ramo_atividade || null,
        city: ext.city || null,
        state: ext.state || null,
        phone: ext.phone || null,
        email: ext.email || null,
        tags: ext.tags_array || [],
        // Preserve all external fields for the form
        nome_fantasia: ext.nome_fantasia || null,
        razao_social: ext.razao_social || null,
        nome_crm: ext.nome_crm || null,
        ramo_atividade: ext.ramo_atividade || null,
        nicho_cliente: ext.nicho_cliente || null,
        cnpj: ext.cnpj || null,
        cnpj_base: ext.cnpj_base || null,
        capital_social: ext.capital_social || null,
        status: ext.status || 'ativo',
        situacao_rf: ext.situacao_rf || null,
        situacao_rf_data: ext.situacao_rf_data || null,
        porte_rf: ext.porte_rf || null,
        natureza_juridica: ext.natureza_juridica || null,
        natureza_juridica_desc: ext.natureza_juridica_desc || null,
        data_fundacao: ext.data_fundacao || null,
        grupo_economico: ext.grupo_economico || null,
        grupo_economico_id: ext.grupo_economico_id || null,
        is_customer: ext.is_customer ?? false,
        is_supplier: ext.is_supplier ?? false,
        is_carrier: ext.is_carrier ?? false,
        is_matriz: ext.is_matriz ?? null,
        tipo_cooperativa: ext.tipo_cooperativa || null,
        numero_cooperativa: ext.numero_cooperativa || null,
        inscricao_estadual: ext.inscricao_estadual || null,
        inscricao_municipal: ext.inscricao_municipal || null,
        cores_marca: ext.cores_marca || null,
        extra_data_rf: ext.extra_data_rf || null,
        bitrix_company_id: ext.bitrix_company_id || null,
      })) as Company[];
      
      setCompanies(mapped);
      setTotalCount(count || 0);
    } catch (error) {
      logger.error('Error fetching companies from external DB:', error);
      toast({
        title: 'Erro ao carregar empresas',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const createCompany = async (company: Omit<CompanyInsert, 'user_id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({ ...company, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [data, ...prev]);
      toast({
        title: 'Empresa criada',
        description: `${data.name} foi adicionada com sucesso.`,
      });
      return data;
    } catch (error) {
      logger.error('Error creating company:', error);
      toast({
        title: 'Erro ao criar empresa',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate) => {
    // Optimistic: apply update immediately
    const previousCompanies = companies;
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } as Company : c));

    try {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Replace with server-confirmed data
      setCompanies(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: 'Empresa atualizada',
        description: 'As alterações foram salvas.',
      });
      return data;
    } catch (error) {
      // Rollback on failure
      setCompanies(previousCompanies);
      logger.error('Error updating company:', error);
      toast({
        title: 'Erro ao atualizar empresa',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    // Optimistic: remove from UI immediately
    const previousCompanies = companies;
    setCompanies(prev => prev.filter(c => c.id !== id));

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Empresa removida',
        description: 'A empresa foi excluída com sucesso.',
      });
      return true;
    } catch (error) {
      // Rollback on failure
      setCompanies(previousCompanies);
      logger.error('Error deleting company:', error);
      toast({
        title: 'Erro ao excluir empresa',
        description: 'Não foi possível excluir a empresa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    companies,
    loading,
    totalCount,
    searchTerm,
    setSearchTerm: (term: string) => {
      setSearchTerm(term);
      fetchCompanies(term);
    },
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
}
