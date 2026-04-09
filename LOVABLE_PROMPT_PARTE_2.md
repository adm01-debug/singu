# 🔒 PROMPT COMPLEMENTAR PRO LOVABLE — Aplicar `withAuth` nas 19 funções restantes

> **Use depois** que os arquivos principais (auth.ts, bitrix24-webhook, evolution-webhook, lux-webhook, disc-analyzer, voice-to-text, external-data) já tiverem sido substituídos no repo.

> Cole TUDO o que está dentro do bloco `===` abaixo no chat do Lovable. Ele aplica em um único commit.

```
═══════════════════════════════════════════════════════════════════════════════
HARDENING — PARTE 2: Aplicar autenticação nas edge functions restantes
═══════════════════════════════════════════════════════════════════════════════

CONTEXTO: O helper supabase/functions/_shared/auth.ts já existe e exporta:
- withAuth(req): autentica via JWT, retorna userId ou Response 401
- requireCronSecret(req): valida X-Cron-Secret header
- corsHeaders, jsonError, jsonOk, handleCorsAndMethod

═══════════════════════════════════════════════════════════════════════════════
GRUPO A — Funções chamadas pelo frontend (aplicar `withAuth`)
═══════════════════════════════════════════════════════════════════════════════

Para CADA uma das funções abaixo, abra o arquivo `supabase/functions/<NOME>/index.ts`
e aplique este patch no início do handler (depois do CORS preflight, antes de
qualquer lógica). Se a função aceita `userId` no body, REMOVA do destructuring
e use o userId retornado pelo `withAuth`.

LISTA:
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

PADRÃO DE PATCH (exemplo):

ANTES:
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
    const { userId, /* outros campos */ } = await req.json();
    // ... lógica
```

DEPOIS:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, withAuth, jsonError, jsonOk } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Authenticate user
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // SEMPRE usar este, ignorar qualquer userId do body

  try {
    const { /* outros campos, SEM userId */ } = await req.json();
    // ... lógica usando o userId do JWT
```

REGRAS:
1. Remova a definição local de `corsHeaders` se houver — importe do helper
2. Substitua todas as `Response` literais por `jsonOk(data)` e `jsonError(msg, status)`
3. Onde quer que a função grave dados marcados com `user_id`, USE o userId do JWT
4. Se a função verifica que um recurso (contact, company, etc) "pertence" ao
   usuário, mantenha essa verificação — agora ela vai funcionar de verdade

═══════════════════════════════════════════════════════════════════════════════
GRUPO B — Funções de cron / scheduled (aplicar `requireCronSecret`)
═══════════════════════════════════════════════════════════════════════════════

Estas funções devem ser chamadas APENAS por schedulers (pg_cron, Supabase
Scheduled Functions ou n8n). Aplique `requireCronSecret`:

LISTA:
- check-notifications
- check-health-alerts
- client-notifications
- template-success-notifications
- smart-reminders
- weekly-digest
- evolution-api  ← este aqui é meio webhook meio API; use requireWebhookSecret
                   com EVOLUTION_API_SECRET / x-evolution-secret

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
    // ... lógica do cron
```

PADRÃO PARA evolution-api (webhook secret):
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

  // ... lógica
```

═══════════════════════════════════════════════════════════════════════════════
NÃO ALTERAR
═══════════════════════════════════════════════════════════════════════════════

- lux-trigger — JÁ tem auth manual correta
- supabase/config.toml — manter verify_jwt=false (auth agora é manual)

═══════════════════════════════════════════════════════════════════════════════
LIMPEZA (Fase final)
═══════════════════════════════════════════════════════════════════════════════

1. Apague o arquivo `package-lock.json` (manter apenas bun.lock/bun.lockb)
2. No README.md, adicione uma seção "Segurança" linkando para docs/SECURITY.md
3. Crie docs/SECURITY.md com o conteúdo:

```markdown
# Política de Segurança — SINGU CRM

## Modelo de autenticação

Todas as edge functions exigem autenticação. Três modos:

### 1. JWT do Supabase (frontend autenticado)
Helper: `withAuth()` em `supabase/functions/_shared/auth.ts`

### 2. Webhook secret (terceiros)
Validação via header customizado, comparação constant-time.

| Função              | EnvVar                    | Header             |
|---------------------|---------------------------|--------------------|
| bitrix24-webhook    | BITRIX24_WEBHOOK_SECRET   | x-bitrix-secret    |
| evolution-webhook   | EVOLUTION_WEBHOOK_SECRET  | x-evolution-secret |
| evolution-api       | EVOLUTION_API_SECRET      | x-evolution-secret |
| lux-webhook         | LUX_WEBHOOK_SECRET        | x-lux-secret       |

### 3. Cron secret (scheduled functions)
Helper: `requireCronSecret(req)` valida `x-cron-secret`.

## Reportando vulnerabilidades
security@promobrindes.com.br — resposta em 48h úteis.

## Segredos
NUNCA commite `.env`. Chaves vazadas devem ser rotacionadas IMEDIATAMENTE no
Supabase Dashboard → Settings → API → Reset.
```

═══════════════════════════════════════════════════════════════════════════════
ENTREGA
═══════════════════════════════════════════════════════════════════════════════

Ao terminar, faça um build pra confirmar e me responda com:
1. Lista de arquivos modificados
2. Confirmação de que o build passou
3. Lista de envs que precisam ser cadastradas no Supabase Dashboard
```
