import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().email().max(255),
  contactId: z.string().uuid().optional().nullable(),
  persist: z.boolean().optional().default(true),
});

const DISPOSABLE = new Set([
  "mailinator.com","tempmail.com","10minutemail.com","guerrillamail.com",
  "throwawaymail.com","yopmail.com","trashmail.com","getnada.com",
  "temp-mail.org","fakeinbox.com","sharklasers.com","maildrop.cc",
]);
const FREE_PROVIDERS = new Set([
  "gmail.com","yahoo.com","hotmail.com","outlook.com","live.com","aol.com",
  "icloud.com","me.com","mail.com","protonmail.com","proton.me","yandex.com",
  "zoho.com","gmx.com","uol.com.br","bol.com.br","terra.com.br","ig.com.br",
]);
const ROLE_PREFIXES = new Set([
  "admin","administrator","contact","contato","info","sales","vendas","support","suporte",
  "help","ajuda","noreply","no-reply","postmaster","webmaster","hello","hi","mail",
  "marketing","comercial","financeiro","rh","hr","ti","it","sac",
]);

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

async function checkMx(domain: string): Promise<boolean> {
  try {
    const records = await Deno.resolveDns(domain, "MX");
    return Array.isArray(records) && records.length > 0;
  } catch {
    try {
      const a = await Deno.resolveDns(domain, "A");
      return Array.isArray(a) && a.length > 0;
    } catch {
      return false;
    }
  }
}

export async function verifyEmail(email: string) {
  const reasons: string[] = [];
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!local || !domain) {
    return { status: "invalid", score: 0, mx_found: false, smtp_check: false, disposable: false, role_account: false, free_provider: false, reasons: ["malformed"] };
  }

  const disposable = DISPOSABLE.has(domain);
  const free = FREE_PROVIDERS.has(domain);
  const role = ROLE_PREFIXES.has(local) || ROLE_PREFIXES.has(local.split(/[.\-_]/)[0]);
  const mx = await checkMx(domain);

  if (disposable) reasons.push("disposable_domain");
  if (role) reasons.push("role_account");
  if (!mx) reasons.push("no_mx_record");
  if (free) reasons.push("free_provider");

  let score = 50;
  if (mx) score += 30; else score -= 30;
  if (!disposable) score += 10;
  if (!role) score += 5;
  if (!free) score += 5;
  score = Math.max(0, Math.min(100, score));

  let status: string;
  if (!mx || disposable) status = "invalid";
  else if (role) status = "risky";
  else if (score >= 75) status = "valid";
  else if (score >= 50) status = "risky";
  else status = "unknown";

  return { status, score, mx_found: mx, smtp_check: false, disposable, role_account: role, free_provider: free, reasons };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { email, contactId, persist } = parsed.data;
    const result = await verifyEmail(email);

    if (persist) {
      const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await admin.from("email_verifications").insert({
        user_id: userData.user.id,
        contact_id: contactId ?? null,
        email,
        ...result,
        provider: "internal",
        raw: result,
      });
    }

    return new Response(JSON.stringify({ email, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
