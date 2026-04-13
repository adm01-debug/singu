import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  unit?: string;
  sku?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Product[]>('get_products', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<{ category: string; count: number }[]>(
        'get_product_categories', {}
      );
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      const { data, error } = await callExternalRpc('create_product', { p_product: product });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso');
    },
    onError: () => toast.error('Erro ao criar produto'),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await callExternalRpc('update_product', { p_product_id: id, p_updates: updates });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado');
    },
    onError: () => toast.error('Erro ao atualizar produto'),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await callExternalRpc('delete_product', { p_product_id: id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido');
    },
    onError: () => toast.error('Erro ao remover produto'),
  });
}
