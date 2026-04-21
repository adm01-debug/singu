import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PassoOutcome =
  | 'respondeu_positivo'
  | 'respondeu_neutro'
  | 'nao_respondeu'
  | 'nao_atendeu'
  | 'pulou';

export interface PassoFeedback {
  id: string;
  contact_id: string;
  passo_id: string;
  outcome: PassoOutcome;
  channel_used: string | null;
  notes: string | null;
  executed_at: string;
  created_at: string;
}

const FEEDBACK_KEY = (contactId: string) => ['proximos-passos-feedback', contactId];

export function useProximoPassoFeedbacks(contactId: string | undefined) {
  return useQuery({
    queryKey: FEEDBACK_KEY(contactId ?? ''),
    enabled: !!contactId,
    staleTime: 60_000,
    queryFn: async (): Promise<PassoFeedback[]> => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data, error } = await supabase
        .from('proximo_passo_feedback')
        .select('id, contact_id, passo_id, outcome, channel_used, notes, executed_at, created_at')
        .eq('contact_id', contactId!)
        .gte('executed_at', since)
        .order('executed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PassoFeedback[];
    },
  });
}

export interface RegisterFeedbackPayload {
  contactId: string;
  passoId: string;
  outcome: PassoOutcome;
  channelUsed?: string | null;
  notes?: string | null;
}

export function useRegisterPassoFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegisterFeedbackPayload) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');
      const { data, error } = await supabase
        .from('proximo_passo_feedback')
        .insert({
          user_id: userId,
          contact_id: payload.contactId,
          passo_id: payload.passoId,
          outcome: payload.outcome,
          channel_used: payload.channelUsed ?? null,
          notes: payload.notes?.trim() ? payload.notes.trim().slice(0, 200) : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as PassoFeedback;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: FEEDBACK_KEY(vars.contactId) });
    },
  });
}

/** Último outcome registrado para um passo, ou null */
export function getLastOutcome(
  feedbacks: PassoFeedback[],
  passoId: string,
): { outcome: PassoOutcome; executedAt: string; daysAgo: number } | null {
  const match = feedbacks.find((f) => f.passo_id === passoId);
  if (!match) return null;
  const t = new Date(match.executed_at).getTime();
  const daysAgo = Math.max(0, Math.floor((Date.now() - t) / 86400000));
  return { outcome: match.outcome, executedAt: match.executed_at, daysAgo };
}

/** Se o passo foi pulado nos últimos 7 dias, retorna a data até quando ele fica silenciado */
export function getRecentSkipUntil(feedbacks: PassoFeedback[], passoId: string): Date | null {
  const skip = feedbacks.find((f) => f.passo_id === passoId && f.outcome === 'pulou');
  if (!skip) return null;
  const until = new Date(new Date(skip.executed_at).getTime() + 7 * 86400000);
  return until.getTime() > Date.now() ? until : null;
}
