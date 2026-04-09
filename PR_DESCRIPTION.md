# 🛡️ Security Hardening — Auth, Webhook Secrets, Sanitization, Audit

## Resumo

Aplica fix crítico de segurança em **7 edge functions vulneráveis**, adiciona observabilidade, testes, CI/CD, dashboards de gestão por processos, rate limiter (Cloudflare Worker) e documentação enterprise completa.

## ⚠️ Vulnerabilidades fechadas

| # | Severidade | Função / Recurso | Vulnerabilidade | Fix |
|---|---|---|---|---|
| 1 | 🔴 CRÍTICA | `external-data` | Aceitava `INSERT/UPDATE/DELETE` em ~50 tabelas externas com `service_role` sem auth | JWT obrigatório + admin role + audit log |
| 2 | 🔴 CRÍTICA | `bitrix24-webhook` | Aberto + injection PostgREST via `ilike` com input do request | Shared secret (`x-bitrix-secret`) + `sanitizePhone` + `.eq` exato |
| 3 | 🔴 CRÍTICA | `evolution-webhook` | Aberto, qualquer um podia injetar mensagens WhatsApp falsas | Shared secret (`x-evolution-secret`) + sanitização |
| 4 | 🔴 CRÍTICA | `lux-webhook` | Aberto, podia corromper análises Lux Intelligence | Shared secret (`x-lux-secret`) |
| 5 | 🔴 CRÍTICA | `disc-analyzer` | Aceitava `userId` arbitrário no payload (impersonação) + queimava créditos AI anonimamente | JWT obrigatório → `userId` vem do JWT + valida ownership do contact |
| 6 | 🟠 ALTA | `voice-to-text` | Anônimo queimava créditos da IA | JWT obrigatório + limite 5MB |
| 7 | 🔴 CRÍTICA | `.env` no git | Chave anon do Supabase exposta no histórico | Removido + `.gitignore` reforçado + chave rotacionada (manual) |

## 📦 Mudanças

### Edge Functions
- `supabase/functions/_shared/auth.ts` — helper expandido com `withAuth`, `requireWebhookSecret`, `requireCronSecret`, `sanitizePhone`, `isAdmin`, `constantTimeEqual`
- 7 funções refatoradas pra usar os helpers
- 2 templates novos (`_template-authenticated/`, `_template-cron/`) pra padronizar criação de novas funções

### Database
- `20260409_security_hardening.sql` — adiciona `profiles.is_admin`, tabela `external_data_audit_log` com RLS admin-only, queries de auditoria de RLS coverage
- `20260409_dashboard_materialized_views.sql` — views para os 3 níveis de dashboard
- `20260409_dashboard_rpcs.sql` — RPCs read-only pros dashboards

### Frontend
- `src/pages/DashboardOperacional.tsx` — métricas do dia, fila de tarefas, alertas P0
- `src/pages/DashboardTatico.tsx` — KPIs semanais, conversões, RFM
- `src/pages/DashboardEstrategico.tsx` — visão executiva, tendências, alertas estratégicos
- `src/lib/sentry.ts` — integração de observabilidade

### Testes
- `src/__tests__/auth-helpers.test.ts` — unit tests de `sanitizePhone`, `constantTimeEqual` (12 casos incluindo injection attempts)
- `src/__tests__/edge-functions.test.ts` — smoke tests cobrindo auth/secret enforcement em 25+ funções

### CI/CD
- `.github/workflows/ci.yml` — pipeline com lint, tsc, vitest, build, gitleaks, deno lint nas edge functions
- `scripts/audit-edge-functions.sh` — auditoria estática que detecta funções sem auth

### Rate Limiting
- `cloudflare-rate-limiter/` — Worker proxy com limite por IP/user/categoria de função

### Documentação
- `docs/SECURITY.md` — política de segurança completa
- `docs/ARQUITETURA.md` — diagramas Mermaid (visão geral, sequence flows, ER, camadas de segurança)
- `docs/POPs_PROCESSOS.md` — POPs dos 10 módulos principais (DISC, NLP, Lux, RFM, etc) em formato BPMN textual
- `docs/KPIs_GESTAO.md` — KPIs por nível (operacional/tático/estratégico) com SQL de exemplo
- `docs/SCHEMA.md` — documentação dos 6 domínios do banco

## 🚀 Deploy checklist

Antes de mergear:

- [ ] **Rotacionar chave anon** no Supabase Dashboard → Settings → API → Reset
- [ ] Atualizar `VITE_SUPABASE_PUBLISHABLE_KEY` no Lovable
- [ ] Cadastrar 5 secrets no Supabase Dashboard → Edge Functions → Secrets:
  - `BITRIX24_WEBHOOK_SECRET`
  - `EVOLUTION_WEBHOOK_SECRET`
  - `EVOLUTION_API_SECRET`
  - `LUX_WEBHOOK_SECRET`
  - `CRON_SECRET`
- [ ] Editar e rodar a migration `20260409_security_hardening.sql` (substituir `'SEU_EMAIL@dominio.com'` pelo seu)
- [ ] Atualizar Bitrix24 webhook outbound com header `x-bitrix-secret`
- [ ] Atualizar Evolution API webhook config com header `x-evolution-secret`
- [ ] Atualizar n8n workflow do Lux com header `x-lux-secret`
- [ ] Atualizar pg_cron / scheduled functions com header `x-cron-secret`

Após mergear:

- [ ] Rodar `./verify-deployment.sh` — todos os checks devem ficar verdes
- [ ] Aplicar `LOVABLE_PROMPT_PARTE_2.md` no Lovable pra cobrir as 19 funções restantes (IA + crons)
- [ ] Verificar logs do Sentry por 24h pra detectar quebras

## 🧪 Como testar localmente

```bash
# Instalar deps
bun install

# Lint + tsc
bun run lint
bun tsc --noEmit

# Tests
bun run test

# Build
bun run build

# Auditoria estática das edge functions
./scripts/audit-edge-functions.sh
```

## 📚 Referências

- [`docs/SECURITY.md`](docs/SECURITY.md) — política completa
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — diagramas
- [OWASP API Top 10](https://owasp.org/API-Security/editions/2023/en/0x00-introduction/)

---

🤖 Co-authored-by: Claude <noreply@anthropic.com>
