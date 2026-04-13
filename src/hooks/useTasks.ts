import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Task {
  id: string;
  contact_id?: string;
  contact_name?: string;
  company_id?: string;
  company_name?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  task_type?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

export function usePendingTasks() {
  return useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Task[]>('get_pending_tasks', {});
        if (error) {
          logger.warn('[Tasks] get_pending_tasks RPC failed, falling back to table query:', error);
          // Fallback: query tasks table directly
          const result = await queryExternalData<Task>({
            table: 'tasks',
            filters: [
              { type: 'neq', column: 'status', value: 'completed' },
              { type: 'neq', column: 'status', value: 'done' },
            ],
            order: { column: 'due_date', ascending: true },
            range: { from: 0, to: 99 },
          });
          if (result.error) throw result.error;
          return result.data || [];
        }
        return (Array.isArray(data) ? data : []) as Task[];
      } catch (e) {
        logger.warn('[Tasks] Fetch pending failed:', e);
        return [] as Task[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Task[]>('get_overdue_tasks', {});
        if (error) {
          logger.warn('[Tasks] get_overdue_tasks RPC failed:', error);
          return [] as Task[];
        }
        return (Array.isArray(data) ? data : []) as Task[];
      } catch (e) {
        logger.warn('[Tasks] Fetch overdue failed:', e);
        return [] as Task[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllTasks(statusFilter?: string) {
  return useQuery({
    queryKey: ['tasks', 'all', statusFilter],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Task[]>('get_all_tasks', {});
        if (error) {
          logger.warn('[Tasks] get_all_tasks RPC failed, falling back:', error);
          const filters: Array<{ type: 'eq' | 'neq'; column: string; value: unknown }> = [];
          if (statusFilter && statusFilter !== 'all') {
            filters.push({ type: 'eq', column: 'status', value: statusFilter });
          }
          const result = await queryExternalData<Task>({
            table: 'tasks',
            filters,
            order: { column: 'due_date', ascending: true },
            range: { from: 0, to: 199 },
          });
          if (result.error) throw result.error;
          return result.data || [];
        }
        const tasks = (Array.isArray(data) ? data : []) as Task[];
        if (statusFilter && statusFilter !== 'all') {
          return tasks.filter(t => t.status === statusFilter);
        }
        return tasks;
      } catch (e) {
        logger.warn('[Tasks] Fetch all failed:', e);
        return [] as Task[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await callExternalRpc<Task>('create_task', task);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('✅ Tarefa criada com sucesso');
    },
    onError: (err) => {
      logger.error('[Tasks] Create failed:', err);
      toast.error('Erro ao criar tarefa');
    },
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await callExternalRpc('complete_task', { p_task_id: taskId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('✅ Tarefa concluída');
    },
    onError: (err) => {
      logger.error('[Tasks] Complete failed:', err);
      toast.error('Erro ao concluir tarefa');
    },
  });
}

export function useSnoozeReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reminderId, hours }: { reminderId: string; hours: number }) => {
      const { data, error } = await callExternalRpc('snooze_reminder', {
        p_reminder_id: reminderId,
        p_snooze_hours: hours,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('⏰ Lembrete adiado');
    },
    onError: (err) => {
      logger.error('[Tasks] Snooze failed:', err);
      toast.error('Erro ao adiar lembrete');
    },
  });
}
