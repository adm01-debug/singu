import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { queryExternalData, insertExternalData, updateExternalData, deleteExternalData } from '@/lib/externalData';
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

      if (search && search.trim().length >= 2) {
        options.search = {
          term: search.trim(),
          columns: ['nome_crm', 'nome_fantasia', 'razao_social', 'ramo_atividade'],
        };
      }

      const { data, count, error } = await queryExternalData<any>(options);
      if (error) throw error;
      
      const mapped = (data || []).map((ext: any) => ({
        ...ext,
        name: ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome',
        industry: ext.ramo_atividade || null,
        tags: ext.tags_array || [],
      })) as Company[];
      
      setCompanies(mapped);
      setTotalCount(count || 0);
    } catch (error) {
      logger.error('Error fetching companies from external DB:', error);
      toast({ title: 'Erro ao carregar empresas', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const createCompany = async (company: Omit<CompanyInsert, 'user_id'>) => {
    if (!user) return null;
    try {
      const { data, error } = await insertExternalData<Company>('companies', { ...company, user_id: user.id });
      if (error) throw error;
      if (data) setCompanies(prev => [data, ...prev]);
      toast({ title: 'Empresa criada', description: `${data?.name || 'Empresa'} foi adicionada com sucesso.` });
      return data;
    } catch (error) {
      logger.error('Error creating company:', error);
      toast({ title: 'Erro ao criar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate) => {
    const previousCompanies = companies;
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } as Company : c));

    try {
      const { data, error } = await updateExternalData<Company>('companies', id, updates);
      if (error) throw error;
      if (data) setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data, name: data.nome_crm || data.nome_fantasia || data.razao_social || data.name } as Company : c));
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      return data;
    } catch (error) {
      setCompanies(previousCompanies);
      logger.error('Error updating company:', error);
      toast({ title: 'Erro ao atualizar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    const previousCompanies = companies;
    setCompanies(prev => prev.filter(c => c.id !== id));

    try {
      const { success, error } = await deleteExternalData('companies', id);
      if (error || !success) throw error || new Error('Delete failed');
      toast({ title: 'Empresa removida', description: 'A empresa foi excluída com sucesso.' });
      return true;
    } catch (error) {
      setCompanies(previousCompanies);
      logger.error('Error deleting company:', error);
      toast({ title: 'Erro ao excluir empresa', description: 'Não foi possível excluir a empresa.', variant: 'destructive' });
      return false;
    }
  };

  return {
    companies, loading, totalCount, searchTerm,
    setSearchTerm: (term: string) => { setSearchTerm(term); fetchCompanies(term); },
    fetchCompanies, createCompany, updateCompany, deleteCompany,
  };
}
