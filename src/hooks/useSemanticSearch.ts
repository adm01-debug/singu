import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SemanticResult = {
  id: string;
  external_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  price: number | null;
  metadata: Record<string, unknown>;
  similarity: number;
};

export function useSemanticSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [cached, setCached] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);

  const search = useCallback(
    async (query: string, opts?: { limit?: number; useAI?: boolean }) => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        return [];
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("semantic-search", {
          body: {
            query: query.trim(),
            limit: opts?.limit ?? 20,
            useAI: opts?.useAI ?? true,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setResults(data.results ?? []);
        setCached(Boolean(data.cached));
        setVariations(data.variations ?? []);
        return data.results as SemanticResult[];
      } catch (e) {
        console.error("Semantic search failed:", e);
        toast.error(e instanceof Error ? e.message : "Erro na busca semântica");
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResults([]);
    setCached(false);
    setVariations([]);
  }, []);

  return { search, results, loading, cached, variations, reset };
}
