import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Args {
  objection: string;
  category?: string;
  interactionIds: string[];
  enabled: boolean;
}

interface Result {
  summary: string;
  basedOn?: number;
  empty?: boolean;
}

/**
 * Carrega — sob demanda — um resumo (1–2 frases) gerado por IA do contexto
 * em que uma objeção aparece nas conversas. O fetch só dispara quando
 * `enabled` for `true` (ex.: usuário ativou a aba "Resumo").
 */
export function useObjectionContextSummary({
  objection,
  category,
  interactionIds,
  enabled,
}: Args) {
  const ids = (interactionIds ?? []).slice(0, 6);
  const idsKey = ids.join(",");

  return useQuery<Result>({
    queryKey: ["objection-context-summary", objection, idsKey],
    enabled: enabled && objection.length > 0 && ids.length > 0,
    staleTime: 30 * 60 * 1000, // 30 min — resumo estável dentro do período
    gcTime: 60 * 60 * 1000,
    retry: (failureCount, err: unknown) => {
      // Não tenta novamente em 402 (créditos) ou 429 (rate limit)
      const msg = err instanceof Error ? err.message : "";
      if (/402|429|Créditos|Limite/i.test(msg)) return false;
      return failureCount < 1;
    },
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<Result>(
        "objection-context-summary",
        {
          body: {
            objection,
            category,
            interactionIds: ids,
          },
        },
      );
      if (error) throw new Error(error.message ?? "Falha ao gerar resumo");
      if (!data) throw new Error("Resposta vazia da função de resumo");
      return data;
    },
  });
}
