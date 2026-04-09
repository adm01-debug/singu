# 🛡️ Política de Segurança — SINGU CRM

**Última atualização:** 2026-04-09
**Versão:** 1.0

---

## 1. Modelo de autenticação

Todas as edge functions exigem autenticação. Existem **quatro modos**:

### 1.1 — JWT do Supabase (frontend autenticado)

Funções chamadas pelo app web. Validação via header `Authorization: Bearer <jwt>`.

**Helper:** `withAuth()` em `supabase/functions/_shared/auth.ts`

```typescript
import { withAuth, jsonError } from "../_shared/auth.ts";

serve(async (req) => {
  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult; // ID autenticado, NUNCA aceitar do payload
  // ...
});
```

**Funções que usam:** disc-analyzer, voice-to-text, ai-writing-assistant, generate-insights, generate-offer-suggestions, suggest-next-action, enrichlayer-linkedin, firecrawl-scrape, enrich-contacts, social-*, rfm-analyzer, elevenlabs-*, voice-agent, send-push-notification, external-data, lux-trigger.

### 1.2 — Webhook secret (terceiros)

Webhooks recebidos de Bitrix24, Evolution API, n8n. Validação via header customizado, comparação constant-time pra mitigar timing attacks.

**Helper:** `requireWebhookSecret(req, envVar, headerName)`

```typescript
import { requireWebhookSecret } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const denied = requireWebhookSecret(req, "BITRIX24_WEBHOOK_SECRET", "x-bitrix-secret");
  if (denied) return denied;
  // ...
});
```

**Mapeamento:**

| Função | Variável de ambiente | Header HTTP |
|---|---|---|
| `bitrix24-webhook` | `BITRIX24_WEBHOOK_SECRET` | `x-bitrix-secret` |
| `evolution-webhook` | `EVOLUTION_WEBHOOK_SECRET` | `x-evolution-secret` |
| `evolution-api` | `EVOLUTION_API_SECRET` | `x-evolution-secret` |
| `lux-webhook` | `LUX_WEBHOOK_SECRET` | `x-lux-secret` |

### 1.3 — Cron secret (scheduled functions)

Funções invocadas por schedulers (pg_cron, Supabase Scheduled, n8n cron).

**Helper:** `requireCronSecret(req)` valida `x-cron-secret`.

**Funções que usam:** check-notifications, check-health-alerts, client-notifications, template-success-notifications, smart-reminders, weekly-digest.

### 1.4 — Admin role (operações sensíveis)

Operações de write em `external-data` exigem `is_admin = true` no perfil do usuário, e geram audit log automaticamente.

**Helper:** `isAdmin(userId)` consulta a tabela `profiles`.

```typescript
import { withAuth, isAdmin, jsonError } from "../_shared/auth.ts";

const userId = await withAuth(req);
if (!(await isAdmin(userId))) {
  return jsonError("Forbidden: admin role required", 403);
}
```

---

## 2. Row-Level Security (RLS)

**Todas as 80+ tabelas em `public` têm RLS habilitado**, com policies baseadas em `auth.uid() = user_id` para SELECT/INSERT/UPDATE/DELETE.

Exceções (RLS por outro critério):
- `external_data_audit_log` — apenas admins podem SELECT (`is_admin = true`)
- `trigger_bundles` — INSERT bloqueado para `is_system_bundle = true`

Auditoria de RLS:
```sql
-- Tabelas sem RLS
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Tabelas com RLS mas sem policies (silently blocked)
SELECT t.tablename, COUNT(p.policyname) 
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public' AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;
```

---

## 3. Sanitização de input

### 3.1 — Telefones
Sempre passar por `sanitizePhone()` antes de usar em queries:

```typescript
import { sanitizePhone } from "../_shared/auth.ts";

const phone = sanitizePhone(rawInput);
if (!phone) return jsonError("Invalid phone", 400);

// Use SEMPRE .eq, NUNCA .ilike com wildcards do user
.or(`phone.eq.${phone},whatsapp.eq.${phone}`)
```

### 3.2 — Tabelas externas
A função `external-data` valida o nome da tabela contra uma allowlist hardcoded. Tentativas de query em `auth.users` ou tabelas não listadas retornam 400.

### 3.3 — Tamanho de payloads
- `voice-to-text`: máximo 5MB de áudio base64
- `disc-analyzer`: texts truncados a 5000 chars antes de salvar
- `external-data`: max page size 100, default 50

---

## 4. Audit log

A tabela `external_data_audit_log` registra todas as operações de write em `external-data`:

```sql
CREATE TABLE public.external_data_audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id),
  operation   text NOT NULL,  -- select, insert, update, delete, etc.
  table_name  text NOT NULL,
  payload     jsonb,
  outcome     text NOT NULL,  -- success, denied, error
  created_at  timestamptz DEFAULT now()
);
```

Apenas admins podem ler. Logs incluem tentativas negadas (`outcome='denied'`), úteis pra detectar abuso.

---

## 5. Gestão de segredos

### 5.1 — Nunca commite segredos
- `.env` está no `.gitignore`
- `.env.example` tem só placeholders
- CI roda gitleaks pra detectar secrets em PRs

### 5.2 — Rotação
Se uma chave vazar:
1. **Imediatamente**: Reset no Supabase Dashboard → Settings → API
2. **Atualizar** Lovable → Environment Variables com a nova chave
3. **Verificar logs** dos últimos dias pra detectar uso indevido
4. **Notificar equipe** se for incidente material

### 5.3 — Secrets necessários no Supabase Dashboard

Edge Functions → Secrets:

| Nome | Origem |
|---|---|
| `BITRIX24_WEBHOOK_SECRET` | gerado aleatório, configurado no Bitrix24 |
| `EVOLUTION_WEBHOOK_SECRET` | gerado aleatório, configurado na Evolution |
| `EVOLUTION_API_SECRET` | gerado aleatório, configurado na Evolution |
| `LUX_WEBHOOK_SECRET` | gerado aleatório, configurado no n8n |
| `CRON_SECRET` | gerado aleatório, configurado no scheduler |
| `LOVABLE_API_KEY` | Lovable AI dashboard |
| `EXTERNAL_SUPABASE_URL` | URL do banco externo |
| `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | service_role do banco externo |
| `N8N_LUX_WEBHOOK_URL` | URL do workflow n8n |

Geração de secrets aleatórios:
```bash
openssl rand -base64 32
# ou
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Rate limiting

**Implementado via Cloudflare Worker** (`cloudflare-rate-limiter/`).

Limites por categoria:

| Categoria | Por minuto | Por hora |
|---|---|---|
| IA cara (DISC, voice, generate-insights) | 5-20 | 50-200 |
| Scraping (Firecrawl, EnrichLayer) | 5 | 50 |
| Operações DB (external-data) | 60 | 1000 |
| Webhooks de terceiros | 300 | 5000 |
| Limite global por IP | 200 | 5000 |

Excesso retorna `429 Too Many Requests` com header `Retry-After: 60`.

---

## 7. CORS

Todas as functions aceitam `Access-Control-Allow-Origin: *` (necessário para o frontend Lovable e webhooks de terceiros). Headers permitidos:

```
authorization, x-client-info, apikey, content-type,
x-bitrix-secret, x-evolution-secret, x-lux-secret, x-cron-secret
```

**Por que `*`?** Lovable serve em domínios variáveis (`*.lovable.app`, custom domains), e webhooks vêm de IPs imprevisíveis. A segurança real está nas camadas 1.1-1.4 acima, não no CORS.

---

## 8. Disclosure responsável

### Reportando vulnerabilidades

**Email:** security@promobrindes.com.br
**SLA de resposta:** 48h úteis
**SLA de fix:** depende da severidade
- Crítico (RCE, auth bypass, data exfiltration): 24-72h
- Alto (XSS persistente, IDOR): 7 dias
- Médio (info disclosure): 14 dias
- Baixo (best practices): próximo sprint

### O que nós PROMETEMOS
- Resposta humana em 48h úteis
- Crédito público (se você quiser) após o fix
- Não tomaremos ações legais contra pesquisadores agindo de boa fé

### O que pedimos
- Não exfiltrar dados de usuários reais (use sua própria conta de teste)
- Não derrubar o serviço (DoS testing exige autorização prévia)
- Dar tempo razoável pra corrigir antes de tornar público

---

## 9. Histórico de incidentes e correções

### 2026-04-09 — Hardening completo (auditoria externa)

**Vulnerabilidades encontradas:**
1. `.env` commitado no repo público com chave anon Supabase
2. 25/28 edge functions sem autenticação (`verify_jwt = false` + sem validação manual)
3. `bitrix24-webhook` vulnerável a injection PostgREST via `.or(.ilike())`
4. `external-data` aceitava INSERT/UPDATE/DELETE em ~50 tabelas externas sem auth
5. Sem audit log de operações sensíveis
6. Sem RBAC (`is_admin` não existia)

**Correções aplicadas:**
1. ✅ `.env` removido + `.gitignore` reforçado + chave rotacionada
2. ✅ Helper `_shared/auth.ts` com `withAuth`, `requireWebhookSecret`, `requireCronSecret`, `sanitizePhone`, `isAdmin`
3. ✅ Patch em todas as edge functions vulneráveis
4. ✅ `bitrix24-webhook` com `sanitizePhone` + `.eq` + shared secret
5. ✅ `external-data` com auth + admin gate + audit log
6. ✅ Migration criando `is_admin`, `external_data_audit_log` com RLS
7. ✅ Suite de smoke tests cobrindo 25+ funções
8. ✅ Cloudflare Worker rate limiter
9. ✅ CI/CD com gitleaks, lint, type-check, build, tests

---

## 10. Compliance

- **LGPD** (Brasil): RLS garante isolamento de dados por usuário; audit log permite rastrear acessos; rotina de exclusão sob solicitação implementada
- **OWASP Top 10**: cobertura de A01 (Broken Access Control), A02 (Cryptographic Failures), A03 (Injection), A05 (Security Misconfiguration), A07 (Identity/Auth Failures), A09 (Logging Failures)
- **SOC 2** (futuro): audit log + access controls são bases para preparação
