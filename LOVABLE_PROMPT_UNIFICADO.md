# 🛡️ SINGU CRM — Prompt Unificado pro Lovable

> **Cole TUDO o que está dentro do bloco `╔════╗ ... ╚════╝` abaixo no chat do Lovable.**
> Este prompt aplica TODAS as correções pendentes em um único commit.
> Após aplicar, o sistema atinge **9.5/10** de score de segurança.

---

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  HARDENING COMPLETO — APLICAR AS 21 EDGE FUNCTIONS RESTANTES                 ║
║                                                                              ║
║  Contexto: o helper supabase/functions/_shared/auth.ts já existe no branch   ║
║  com TODOS os helpers necessários: withAuth, withAuthOrServiceRole,          ║
║  isServiceRoleCaller, requireWebhookSecret, requireCronSecret, sanitizePhone,║
║  isAdmin (via has_role RPC), corsHeaders, jsonError, jsonOk, handleCorsAndMethod
║                                                                              ║
║  Este prompt cobre as funções que ainda não foram patcheadas no PR #3.       ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
GRUPO A — Aplicar `withAuth` (15 funções chamadas pelo frontend)
═══════════════════════════════════════════════════════════════════════════════

Para CADA função abaixo, abra `supabase/functions/<NOME>/index.ts` e aplique
este patch (depois do CORS preflight, antes da lógica). Se a função aceita
`userId` no body, REMOVA do destructuring e use o userId do JWT.

LISTA DE FUNÇÕES DO GRUPO A:
- ai-writing-assistant
- generate-insights
- generate-offer-suggestions
- suggest-next-action
- enrichlayer-linkedin
- firecrawl-scrape
- enrich-contacts
- social-profile-scraper
- social-behavior-analyzer
- social-events-detector
- rfm-analyzer
- elevenlabs-tts
- elevenlabs-scribe-token
- voice-agent
- send-push-notification

PADRÃO DE PATCH:

ANTES (típico):
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { userId, /* outros */ } = await req.json();
    // lógica usando userId do body
```

DEPOIS:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Authenticate — userId from JWT, not from body
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // SEMPRE este, ignora qualquer userId do body

  try {
    const { /* outros campos, SEM userId */ } = await req.json();
    // lógica usando o userId do JWT
```

REGRAS:
1. Remover definição local de `corsHeaders` se houver — importar do helper
2. Substituir `Response` literais por `jsonOk(data)` e `jsonError(msg, status)`
3. Toda gravação com user_id deve usar o userId do JWT
4. Verificações de ownership (contact pertence ao user) ficam IGUAIS — agora funcionam de verdade

═══════════════════════════════════════════════════════════════════════════════
GRUPO B — Cron secret (6 funções de scheduled jobs)
═══════════════════════════════════════════════════════════════════════════════

Estas funções devem ser chamadas APENAS por schedulers (pg_cron, Supabase
Scheduled Functions, n8n). Aplicar `requireCronSecret`:

LISTA:
- check-notifications
- check-health-alerts
- client-notifications
- template-success-notifications
- smart-reminders
- weekly-digest

PADRÃO PARA CRONS:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, requireCronSecret, jsonError, jsonOk } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Cron secret validation
  const cronError = requireCronSecret(req);
  if (cronError) return cronError;

  try {
    // lógica do cron
```

═══════════════════════════════════════════════════════════════════════════════
GRUPO C — evolution-api (webhook secret)
═══════════════════════════════════════════════════════════════════════════════

Esta é meio webhook, meio API. Use `requireWebhookSecret` com EVOLUTION_API_SECRET:

```typescript
import { corsHeaders, requireWebhookSecret, jsonError, jsonOk } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const secretError = requireWebhookSecret(
    req, "EVOLUTION_API_SECRET", "x-evolution-secret"
  );
  if (secretError) return secretError;

  // lógica
```

═══════════════════════════════════════════════════════════════════════════════
GRUPO D — Funções S2S (server-to-server) — usar withAuthOrServiceRole
═══════════════════════════════════════════════════════════════════════════════

Algumas funções (rfm-analyzer, smart-reminders, template-success-notifications)
podem ser chamadas tanto pelo frontend (user JWT) quanto por crons/outras edges
(service_role). Para essas, use `withAuthOrServiceRole`:

```typescript
import { corsHeaders, withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;

  const body = await req.json();
  let userId: string;
  if (isServiceRoleCaller(authResult)) {
    if (!body.userId) return jsonError("userId required for service-role calls", 400);
    userId = body.userId;
  } else {
    userId = authResult; // user JWT — anti-impersonação
  }

  // lógica
```

═══════════════════════════════════════════════════════════════════════════════
GRUPO E — NÃO ALTERAR estas funções (já estão OK)
═══════════════════════════════════════════════════════════════════════════════

- bitrix24-webhook (já patcheada no PR #3)
- evolution-webhook (já patcheada no PR #3 + round 4 anti-pollution)
- lux-webhook (já patcheada no PR #3)
- lux-trigger (já tinha auth manual correta)
- disc-analyzer (já patcheada no PR #3 + round 2 dual-auth)
- voice-to-text (já patcheada no PR #3)
- external-data (já patcheada no PR #3 + round 2 has_role)

NÃO mexer no supabase/config.toml — manter `verify_jwt = false` em todas
(a auth agora é manual via helpers, dá mais flexibilidade).

═══════════════════════════════════════════════════════════════════════════════
GRUPO F — Limpeza final
═══════════════════════════════════════════════════════════════════════════════

1. Confirme que `package-lock.json` foi removido (deve estar — round 3 do PR #3)
2. Mantenha apenas `bun.lock` + `bun.lockb`
3. Verifique que `.env` NÃO está no repositório (apenas `.env.example`)
4. Confirme que `index.html` tem os meta tags de CSP, X-Frame-Options, etc
   (foi adicionado no round 1 do PR #3)
5. Confirme que `vite.config.ts` tem `lovable-tagger` apenas em mode === "development"
   e `sourcemap: 'hidden'` em prod (foi adicionado no round 2)

═══════════════════════════════════════════════════════════════════════════════
GRUPO G — Validação final
═══════════════════════════════════════════════════════════════════════════════

Após aplicar tudo, faça:

1. Build local: `bun run build` — deve passar sem warnings de tipo
2. Lint: `bun run lint` — sem erros
3. Tipos: `bun run typecheck` — sem erros
4. Tests: `bun run test` — todos verdes (incluindo os 18 novos tests do dual-auth)

═══════════════════════════════════════════════════════════════════════════════
ENTREGA — me responda com:
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Lista de arquivos modificados (deve ser ~21 funções + verificações)
2. ✅ Output do `bun run build` confirmando sucesso
3. ✅ Output do `bun run test` confirmando todos verdes
4. ✅ Lista de envs que precisam estar cadastradas no Supabase Dashboard:
   - BITRIX24_WEBHOOK_SECRET
   - EVOLUTION_WEBHOOK_SECRET
   - EVOLUTION_API_SECRET
   - LUX_WEBHOOK_SECRET
   - CRON_SECRET
   - LOVABLE_API_KEY (já deve existir)
   - EXTERNAL_SUPABASE_URL (já deve existir)
   - EXTERNAL_SUPABASE_SERVICE_ROLE_KEY (já deve existir)

5. ✅ Confirmação de que NÃO mexeu nas funções já patcheadas (Grupo E)

═══════════════════════════════════════════════════════════════════════════════
FIM DO PROMPT
═══════════════════════════════════════════════════════════════════════════════
```

---

## 📋 Checklist do Pink após aplicar

- [ ] 🔥 Revogar PAT que vazou no chat (https://github.com/settings/tokens)
- [ ] Rotacionar chave anon (Supabase Dashboard → Settings → API → Reset)
- [ ] Cadastrar 5 secrets no Supabase Dashboard → Edge Functions → Secrets
- [ ] Editar e rodar `supabase/migrations/20260409_security_hardening.sql` (linha 41 — email)
- [ ] Editar e rodar `supabase/migrations/20260410_audit_cleanup.sql` (linha 26 — email)
- [ ] Atualizar Bitrix24 outbound webhook com header `x-bitrix-secret`
- [ ] Atualizar Evolution API config com headers `x-evolution-secret`
- [ ] Atualizar n8n workflow Lux com header `x-lux-secret`
- [ ] Atualizar pg_cron / scheduled functions com header `x-cron-secret`
- [ ] Mergear PR #3
- [ ] Aplicar este prompt no Lovable
- [ ] Rodar `./verify-deployment.sh` — confirmar todos verdes

## 🎯 Score esperado após tudo aplicado

- **Antes:** 6.6/10
- **Após PR #3:** 7.6/10
- **Após este prompt + checklist:** **9.5/10** ✅ pronto pra produção

