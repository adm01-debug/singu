/**
 * SINGU CRM — Cloudflare Worker Rate Limiter
 *
 * Proxy na frente do Supabase Edge Functions.
 * Aplica rate limiting por IP, por user (JWT), e por função.
 *
 * Deploy:
 *   1. wrangler init singu-rate-limiter
 *   2. Copiar este arquivo para src/index.ts
 *   3. Configurar wrangler.toml (ver wrangler.toml exemplo abaixo)
 *   4. wrangler deploy
 *
 * Configurar DNS:
 *   api.singu.promobrindes.com.br → CNAME → <worker-url>.workers.dev
 *
 * Atualizar VITE_SUPABASE_URL no Lovable para apontar pro proxy
 *   VITE_SUPABASE_URL=https://api.singu.promobrindes.com.br
 *
 * O worker repassa a Authorization header e demais para o Supabase real.
 */

interface Env {
  SUPABASE_REAL_URL: string; // https://rqodmqosrotmtrjnnjul.supabase.co
  RATE_LIMIT_KV: KVNamespace; // KV namespace para counters
}

// Limites por categoria de função (chamadas por minuto, por user)
const RATE_LIMITS: Record<string, { perMinute: number; perHour: number }> = {
  // IA = caro, limitar
  "disc-analyzer": { perMinute: 20, perHour: 200 },
  "voice-to-text": { perMinute: 10, perHour: 100 },
  "ai-writing-assistant": { perMinute: 30, perHour: 300 },
  "generate-insights": { perMinute: 5, perHour: 50 },
  "generate-offer-suggestions": { perMinute: 10, perHour: 100 },
  "suggest-next-action": { perMinute: 30, perHour: 300 },
  "rfm-analyzer": { perMinute: 5, perHour: 50 },
  "elevenlabs-tts": { perMinute: 10, perHour: 100 },
  "voice-agent": { perMinute: 20, perHour: 200 },

  // Scraping caro
  "firecrawl-scrape": { perMinute: 5, perHour: 50 },
  "enrichlayer-linkedin": { perMinute: 5, perHour: 50 },
  "social-profile-scraper": { perMinute: 10, perHour: 100 },
  "lux-trigger": { perMinute: 3, perHour: 20 },

  // Operações de banco — mais permissivas
  "external-data": { perMinute: 60, perHour: 1000 },

  // Webhooks — limites altíssimos (são bursts legítimos de terceiros)
  "bitrix24-webhook": { perMinute: 300, perHour: 5000 },
  "evolution-webhook": { perMinute: 300, perHour: 5000 },
  "lux-webhook": { perMinute: 60, perHour: 500 },

  // Default
  "_default": { perMinute: 60, perHour: 600 },
};

// Limite global por IP (proteção contra DDoS / scraping anônimo)
const IP_LIMIT_PER_MINUTE = 200;
const IP_LIMIT_PER_HOUR = 5000;

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // Health check
    if (url.pathname === "/__health") {
      return new Response("ok", { status: 200 });
    }

    // Apenas rotas /functions/v1/* são rate-limited
    const isFunction = url.pathname.startsWith("/functions/v1/");

    if (isFunction) {
      const fnName = url.pathname.replace("/functions/v1/", "").split("/")[0];
      const limits = RATE_LIMITS[fnName] || RATE_LIMITS["_default"];

      // 1. Rate limit por IP
      const clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        "unknown";

      const ipBlocked = await checkAndIncrement(
        env.RATE_LIMIT_KV,
        `ip:${clientIp}:1m`,
        IP_LIMIT_PER_MINUTE,
        60
      );
      if (ipBlocked) {
        return tooManyRequests("IP rate limit exceeded (1 min)");
      }

      const ipHourBlocked = await checkAndIncrement(
        env.RATE_LIMIT_KV,
        `ip:${clientIp}:1h`,
        IP_LIMIT_PER_HOUR,
        3600
      );
      if (ipHourBlocked) {
        return tooManyRequests("IP rate limit exceeded (1 hour)");
      }

      // 2. Rate limit por user (extraído do JWT)
      const userId = await extractUserIdFromJWT(req.headers.get("authorization"));
      if (userId) {
        const userBlocked = await checkAndIncrement(
          env.RATE_LIMIT_KV,
          `user:${userId}:${fnName}:1m`,
          limits.perMinute,
          60
        );
        if (userBlocked) {
          return tooManyRequests(
            `User rate limit exceeded for ${fnName} (${limits.perMinute}/min)`
          );
        }

        const userHourBlocked = await checkAndIncrement(
          env.RATE_LIMIT_KV,
          `user:${userId}:${fnName}:1h`,
          limits.perHour,
          3600
        );
        if (userHourBlocked) {
          return tooManyRequests(
            `User rate limit exceeded for ${fnName} (${limits.perHour}/hour)`
          );
        }
      }
    }

    // Repassa pra Supabase real
    const supabaseUrl = new URL(env.SUPABASE_REAL_URL);
    const targetUrl = new URL(url.pathname + url.search, supabaseUrl);

    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
      redirect: "manual",
    });

    const response = await fetch(proxyReq);
    return response;
  },
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

async function checkAndIncrement(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const current = parseInt((await kv.get(key)) || "0", 10);
  if (current >= limit) {
    return true; // blocked
  }
  await kv.put(key, String(current + 1), { expirationTtl: windowSeconds });
  return false;
}

function tooManyRequests(message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}

async function extractUserIdFromJWT(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub || null;
  } catch {
    return null;
  }
}
