import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface WorkspaceAccount {
  id: string;
  email: string | null;
  email_normalizado: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: string | null;
  department: string | null;
  is_active: boolean | null;
  last_login_at: string | null;
  created_at: string;
}

export function useWorkspaceAccounts() {
  return useQuery({
    queryKey: ['workspace-accounts'],
    queryFn: async () => {
      const { data, error } = await queryExternalData<WorkspaceAccount>({
        table: 'workspace_accounts',
        order: { column: 'display_name', ascending: true },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
