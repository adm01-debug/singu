import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_MINUTES = 10;

async function hashQuery(text: string): Promise<string> {
  const data = new TextEncoder().encode(text.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function expandQueryWithAI(query: string): Promise<string[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return [query];

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você expande consultas de busca de produtos em sinônimos e termos relacionados em português. Retorne APENAS um array JSON com 3-5 variações curtas, sem explicações.",
          },
          { role: "user", content: query },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "expand_query",
              description: "Retorna variações da consulta",
              parameters: {
                type: "object",
                properties: {
                  variations: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["variations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "expand_query" } },
      }),
    });

    if (!resp.ok) return [query];
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return [query];
    const parsed = JSON.parse(args);
    return Array.from(new Set([query, ...(parsed.variations || [])]));
  } catch (e) {
    console.error("AI expansion failed:", e);
    return [query];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const query = String(body?.query ?? "").trim();
    const limit = Math.min(Math.max(Number(body?.limit ?? 20), 1), 50);
    const useAI = body?.useAI !== false;

    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queryHash = await hashQuery(`${query}:${limit}:${useAI}`);

    // Check cache
    const { data: cached } = await supabase
      .from("semantic_search_cache")
      .select("results, expires_at")
      .eq("user_id", user.id)
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ results: cached.results, cached: true, query }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expand query with AI for better recall
    const variations = useAI ? await expandQueryWithAI(query) : [query];

    // Run RPC for each variation and merge by best similarity
    const merged = new Map<string, any>();
    for (const v of variations) {
      const { data, error } = await supabase.rpc("search_products_semantic", {
        p_user_id: user.id,
        p_query: v,
        p_limit: limit,
        p_min_similarity: 0.1,
      });
      if (error) {
        console.error("RPC error:", error);
        continue;
      }
      for (const row of data || []) {
        const existing = merged.get(row.id);
        if (!existing || row.similarity > existing.similarity) {
          merged.set(row.id, row);
        }
      }
    }

    const results = Array.from(merged.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Persist cache (best-effort)
    const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString();
    await supabase
      .from("semantic_search_cache")
      .upsert(
        {
          user_id: user.id,
          query_hash: queryHash,
          query_text: query,
          results,
          expires_at: expiresAt,
        },
        { onConflict: "user_id,query_hash" }
      );

    return new Response(
      JSON.stringify({ results, cached: false, query, variations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("semantic-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
