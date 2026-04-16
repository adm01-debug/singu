import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";
import { scopedCorsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20, message: "Rate limit exceeded for ask-crm." });

const InputSchema = z.object({
  question: z.string().min(3).max(500),
});

const SYSTEM_PROMPT = `Você é o assistente inteligente do SINGU CRM. O usuário fará perguntas em linguagem natural sobre seus dados de CRM.

Você tem acesso às seguintes tabelas do banco de dados (todas filtradas pelo user_id do usuário autenticado):

TABELAS DISPONÍVEIS:
- contacts: first_name, last_name, email, phone, role, role_title, company_id, relationship_score (0-100), relationship_stage, sentiment, tags[], birthday, created_at, updated_at
- companies: name, cnpj, industry, city, state, phone, email, status, tags[], is_customer, is_supplier, annual_revenue, employee_count, created_at
- interactions: contact_id, type (email/call/meeting/whatsapp/note), subject, notes, sentiment (positive/neutral/negative), duration_minutes, created_at
- deals: title, value, stage (lead/qualified/proposal/negotiation/won/lost), contact_id, company_id, expected_close_date, probability, created_at
- tasks: title, description, status (pending/in_progress/completed/cancelled), priority (low/medium/high/urgent), due_date, contact_id, company_id, created_at

REGRAS:
1. Gere APENAS consultas SELECT — nunca INSERT, UPDATE, DELETE, DROP, ALTER, etc.
2. SEMPRE filtre por user_id = '{USER_ID}' para segurança
3. Use ILIKE para buscas textuais com %termo%
4. Limite resultados a no máximo 20 rows
5. Para datas relativas: use NOW(), INTERVAL, date_trunc()
6. Para contagem, use COUNT(*) com alias descritivo
7. Retorne campos úteis, não SELECT *

Responda com um JSON:
{
  "sql": "SELECT ...",
  "explanation": "Explicação curta do que a query faz",
  "display_type": "table|number|list"
}

Se a pergunta não for sobre dados do CRM ou não puder ser respondida com as tabelas disponíveis, retorne:
{
  "sql": null,
  "explanation": "Motivo pelo qual não pode responder",
  "display_type": "text"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: scopedCorsHeaders(req) });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const rawBody = await req.json();
    const parsed = InputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return jsonError(`Input inválido: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`, 400, req);
    }

    const { question } = parsed.data;
    const prompt = SYSTEM_PROMPT.replace("{USER_ID}", userId);

    // Step 1: Generate SQL from question
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: question },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) return jsonError("Limite de requisições excedido.", 429, req);
      if (aiResponse.status === 402) return jsonError("Créditos insuficientes.", 402, req);
      console.error("AI error:", aiResponse.status);
      return jsonError("Erro ao processar pergunta", 500, req);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed_ai: { sql: string | null; explanation: string; display_type: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      parsed_ai = JSON.parse(jsonMatch[0]);
    } catch {
      return jsonOk({ answer: content, data: null, display_type: "text", sql: null }, req);
    }

    if (!parsed_ai.sql) {
      return jsonOk({ answer: parsed_ai.explanation, data: null, display_type: "text", sql: null }, req);
    }

    // Security: validate SQL is SELECT only
    const sqlUpper = parsed_ai.sql.trim().toUpperCase();
    const forbidden = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE"];
    if (!sqlUpper.startsWith("SELECT") || forbidden.some(kw => sqlUpper.includes(kw + " "))) {
      return jsonError("Consulta não permitida. Apenas leituras são aceitas.", 403, req);
    }

    // Ensure user_id filter is present
    if (!parsed_ai.sql.includes(userId)) {
      return jsonError("Consulta deve filtrar por usuário autenticado.", 403, req);
    }

    // Step 2: Execute the query
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("execute_readonly_query", {
      query_text: parsed_ai.sql,
    });

    if (error) {
      console.error("Query execution error:", error);
      return jsonOk({
        answer: parsed_ai.explanation,
        data: null,
        display_type: "text",
        sql: parsed_ai.sql,
        error: "Não foi possível executar a consulta. Tente reformular.",
      }, req);
    }

    return jsonOk({
      answer: parsed_ai.explanation,
      data,
      display_type: parsed_ai.display_type,
      sql: parsed_ai.sql,
    }, req);
  } catch (error) {
    console.error("ask-crm error:", error);
    return jsonError(error instanceof Error ? error.message : "Erro desconhecido", 500, req);
  }
});
