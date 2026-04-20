# SINGU CRM — Runbook Operacional

> **Documento único e autoritativo** para deploy, rollback, monitoramento e resposta a incidentes em produção.
> Última revisão: Rodada P (consolidação `RUNBOOK.md` + `runbook.md`).

## 📚 Documentos relacionados

- [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md) — Plano de recuperação de desastre, on-call, RTO/RPO
- [`LOAD_TESTING.md`](./LOAD_TESTING.md) — Testes de carga k6, baselines de capacidade
- [`SECURITY.md`](./SECURITY.md) — Políticas, RLS, hardening
- [`EDGE_FUNCTIONS_API.md`](./EDGE_FUNCTIONS_API.md) — Contratos de cada função
- [`adr/`](./adr/) — 18 Architecture Decision Records

## 📋 Índice

1. [Deploy](#-deploy)
2. [Rollback](#-rollback)
3. [Health Check](#-health-check)
4. [Edge Functions — Inventário](#-edge-functions--inventário)
5. [Banco de Dados](#-banco-de-dados)
6. [Monitoramento, Tracing & SLOs](#-monitoramento-tracing--slos)
7. [Severidades de Incidente](#-severidades-de-incidente)
8. [Resposta a Incidentes](#-resposta-a-incidentes)
9. [Playbook de Comunicação](#-playbook-de-comunicação)
10. [Troubleshooting (12 cenários)](#-troubleshooting)
11. [Feature Flags & Kill Switches](#-feature-flags--kill-switches)
12. [Segurança & Rotação de Secrets](#-segurança--rotação-de-secrets)

---

## 🚀 Deploy

### Frontend (Lovable)
- Commits na branch `main` disparam deploy automático.
- Preview builds por branch/PR em `id-preview--*.lovable.app`.
- Produção: `https://dialogue-diamond.lovable.app`.

### Edge Functions
- Deploy automático ao alterar `supabase/functions/`.
- Verificação pós-deploy: chamar `/functions/v1/system-health`.

### Migrations
1. Criar migration via ferramenta `supabase--migration`.
2. Aguardar aprovação do usuário.
3. Executada automaticamente após aprovação.
4. Tipos atualizados em `src/integrations/supabase/types.ts` (auto-gerado).

### Checklist anti-regressão de Edge Functions

1. **Imports** — usar `npm:pacote@versao`. **Proibido** `https://esm.sh/...` (esm.sh ocasionalmente retorna 502 e quebra boot).
2. **Lock file** — se deploy falhar com `Module not found`, apagar `supabase/functions/deno.lock` e redeployar.
3. **Tracing** — usar `tracedLogger(req, "<fn-name>")` e emitir `log.info("request_received", {...})` no início do handler.
4. **Smoke test** — `supabase--curl_edge_functions` com payload mínimo: HTTP 200, header `x-trace-id`, log `request_received`.
5. **Rollback** — reverter via histórico Lovable e redeployar (stateless).
6. **Lint guard** — `node scripts/check-edge-imports.mjs` (exit 1 se importar `esm.sh`).

---

## ⏪ Rollback

| Camada | Procedimento | Tempo |
|---|---|---|
| Frontend | Histórico de versões do Lovable | < 2 min |
| Edge Functions | Reverter código + redeploy | < 5 min |
| Banco de Dados | **Forward-only** — criar nova migration que desfaz | Variável |

> ⚠️ Migrations destrutivas exigem backup lógico prévio (`pg_dump`).

---

## 🏥 Health Check

### Endpoint
```
GET/POST /functions/v1/system-health
```
Público (sem JWT). Retorna `200 OK` se `healthy`/`degraded`, `503` se `unhealthy`.

### Componentes verificados (5)

| Componente | Origem | Significado |
|---|---|---|
| `database_local` | Supabase local (`profiles`) | DB principal do app |
| `database_external` | Supabase externo (`companies`) | Banco corporativo |
| `whatsapp` | Evolution API `/instance/fetchInstances` | Sync WhatsApp |
| `email_pipeline` | `email_logs` (último registro) | Pipeline Gmail/Pub/Sub |
| `voice_ai` | ElevenLabs `/v1/models` | STT/TTS |

### Status semântico

- `up` — funcionando normalmente
- `degraded` — responde mas com latência alta ou último evento >1h
- `down` — falha de conectividade
- `not_configured` — secrets ausentes (não é incidente)

### Overall

- `healthy` — todos `up` ou `not_configured`
- `degraded` — algum `degraded`
- `unhealthy` — algum `down` (HTTP 503)

UI: widget `SystemHealthWidget` (admin header) + página pública `/status`.

---

## ⚡ Edge Functions — Inventário

**Total: 90+ funções.** Agrupadas por categoria com auth guard.

### A — Autenticadas via JWT (`withAuth`)
Funções chamadas pelo frontend autenticado.

| Grupo | Exemplos | Rate limit |
|---|---|---|
| **Dados externos** | `external-data` | 100/min/IP |
| **AI consultiva** | `ask-crm`, `ai-writing-assistant`, `ai-email-refine`, `conversational-search`, `semantic-search` | 20/min/IP |
| **AI análise** | `disc-analyzer`, `rfm-analyzer`, `lead-scorer`, `forecast-analyzer`, `win-loss-analyzer`, `detect-churn-risk`, `meeting-summary`, `email-thread-summary`, `playbook-generator`, `next-best-action`, `suggest-next-action`, `generate-insights`, `generate-offer-suggestions` | 10/min/IP |
| **Enriquecimento** | `enrich-contacts`, `email-verifier`, `email-finder`, `phone-validator`, `firecrawl-scrape`, `enrichlayer-linkedin`, `social-profile-scraper` | 30/min/IP |
| **ABM/Intent** | `abm-account-scorer`, `abm-whitespace-analyzer`, `intent-aggregator`, `intent-tracker`, `mql-evaluator` | 30/min/IP |
| **Connections** | `connection-tester`, `connection-introspect`, `connection-anomaly-detector`, `ai-suggest-mapping` | 30/min/IP |
| **Voice** | `voice-agent`, `voice-to-text`, `elevenlabs-tts`, `elevenlabs-scribe-token`, `voice-ai-health` | 30/min/IP |
| **Deal Rooms** | `deal-room-share`, `deal-room-health`, `deal-room-buyer-view` | 30/min/IP |
| **Forecast/RevOps** | `forecast-narrative`, `attribution-calculator`, `demand-forecast`, `revops-snapshot-builder` | 20/min/IP |
| **Outros** | `audit-analytics`, `territory-optimization`, `lead-routing`, `visual-search`, `conversation-analyzer`, `social-behavior-analyzer`, `social-events-detector`, `bulk-revalidate` | 20-30/min/IP |

### B — Crons (`requireCronSecret`)
Disparados via cron interno; exigem header `x-cron-secret`.

`client-notifications`, `check-notifications`, `weekly-digest`, `check-health-alerts`, `template-success-notifications`, `forecast-snapshot-cron`, `lead-score-cron`, `lead-score-threshold-runner`, `nurturing-runner`, `sequence-processor`, `cs-health-recalc`, `conversation-coaching-digest`, `validation-queue-worker`, `process-webhook-dlq`.

### C — Públicas (sem JWT)
`system-health`, `health`, `health-aggregate`, `intent-pixel-snippet`, `form-submit-handler`, `sequence-track`, `submit-signature`, `get-signature`, `validate-access`, `detect-new-device`.

### D — Service-to-Service (`withAuthOrServiceRole`)
`smart-reminders`, `send-push-notification`, `send-sms-campaign`, `smart-notify`.

### E — Webhooks (segredo de integração)
`evolution-webhook`, `bitrix24-webhook`, `lux-webhook`, `lux-trigger`, `incoming-webhook`, `evolution-api`.

### F — Especiais
`mcp-server` (Model Context Protocol), `win-loss-record-deal`.

### Limites operacionais
- Timeout padrão: 60s (150s para AI).
- Payload máx: 6 MB.
- Rate limit: in-memory por IP (`_shared/rate-limit.ts`), reseta em cold start.

---

## 🗄️ Banco de Dados

| Banco | Uso | Tabelas |
|---|---|---|
| **Supabase Local** | App data (contatos, deals, AI) | ~200 |
| **Supabase Externo** | Legado/corporativo (companies, cooperativas) | ~220 |

- Pooling: PgBouncer automático (60 diretas / 200 pooler).
- Queries lentas: `query_telemetry` + badge global frontend (>3s).
- Optimistic locking: coluna `version` em `contacts`/`companies`; conflito → HTTP 409 `CONCURRENT_EDIT`.

---

## 📊 Monitoramento, Tracing & SLOs

### Web Vitals (frontend)
`useWebVitals.ts` em produção. Metas: LCP < 2.0s, INP < 200ms, CLS < 0.1.

### Circuit Breaker
`src/lib/circuitBreaker.ts` — CLOSED → OPEN → HALF_OPEN. Protege banco externo e APIs terceiras.

### Tracing distribuído

Toda resposta das funções críticas (`external-data`, `ask-crm`, `ai-suggest-mapping`, `connection-anomaly-detector`, `incoming-webhook`) inclui header `x-trace-id` (UUID v4).

```bash
# Capturar traceId
curl -i -X POST "$SUPABASE_URL/functions/v1/external-data" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT" \
  -d '{"action":"select","table":"contacts","limit":1}' | grep -i x-trace-id

# Buscar logs correlacionados
supabase functions logs external-data --search "traceId=<uuid>"
```

Mensagens-chave: `request_received`, `concurrent_edit_detected`, `upstream_gateway_error`, `uncaught error`.

### SLOs

| Métrica | Alvo | Fonte |
|---|---|---|
| Disponibilidade `external-data` | ≥ 99.5% (200, inclui `fallback:true`) | Supabase logs |
| Latência `select` P95 | < 2.0s | `query_telemetry` |
| Latência `update_with_version` P95 | < 3.0s | `query_telemetry` |
| Taxa de conflito 409 | < 5%/min | logs `concurrent_edit_detected` |
| Taxa de erro 5xx | < 1%/min | logs `level=error` |
| `system-health` overall | `healthy` ≥ 99% do tempo | endpoint público |

### Comandos SQL de diagnóstico

```sql
-- Top 10 queries mais lentas (24h)
SELECT operation, table_name, duration_ms, occurred_at
FROM query_telemetry
WHERE occurred_at > now() - interval '24 hours'
ORDER BY duration_ms DESC LIMIT 10;

-- Conflitos 409 por hora
SELECT date_trunc('hour', occurred_at) AS hour, COUNT(*) AS conflicts
FROM query_telemetry
WHERE error_code = '409' AND occurred_at > now() - interval '24 hours'
GROUP BY 1 ORDER BY 1 DESC;

-- Alertas ativos
SELECT type, priority, COUNT(*) FROM alerts
WHERE dismissed = false GROUP BY 1,2;
```

---

## 🚨 Severidades de Incidente

| Nível | Gatilho objetivo | SLA Resposta | SLA Resolução |
|---|---|---|---|
| **P1 — Crítico** | `system-health` `unhealthy` por >5 min **OU** >50% usuários sem login **OU** perda de dados confirmada | 15 min | 4 h |
| **P2 — Alto** | Módulo core (Contatos/Empresas/Pipeline) com >5% taxa de erro **OU** latência P95 >2× SLO por 15 min | 1 h | 24 h |
| **P3 — Médio** | Módulo secundário degradado afetando <20% usuários **OU** componente `degraded` no health por >1 h | 4 h | 5 dias úteis |
| **P4 — Baixo** | Bug visual/copy sem impacto funcional | Próximo sprint | Backlog |

---

## 🚨 Resposta a Incidentes

1. **Identificar** — `system-health`, console browser, `supabase functions logs`, `traceId`.
2. **Comunicar** — usar templates do [Playbook de Comunicação](#-playbook-de-comunicação).
3. **Isolar** — circuit breaker / kill switch (ver [Feature Flags](#-feature-flags--kill-switches)).
4. **Corrigir** — hotfix ou rollback.
5. **Validar** — `system-health` verde por 30 min + teste manual.
6. **Post-mortem** — em até 48 h: causa raiz, impacto (usuários, duração), ações preventivas. Registrar em `docs/postmortems/AAAA-MM-DD.md`.

On-call rotation: ver [`DISASTER_RECOVERY.md`](./DISASTER_RECOVERY.md#on-call-rotation).

---

## 📣 Playbook de Comunicação

### Canais oficiais
- Status page pública: `https://dialogue-diamond.lovable.app/status`
- Email transacional para usuários ativos (via pipeline Gmail)
- Notificações in-app via `smart-notify`

### Templates (PT-BR)

**Incidente em curso (≤15 min após detecção)**
```
[SINGU] Estamos investigando uma degradação em {módulo}.
Início: {HH:MM BRT}. Impacto: {descrição em 1 frase}.
Próxima atualização em 30 min. Status: dialogue-diamond.lovable.app/status
```

**Resolução**
```
[SINGU] Incidente resolvido às {HH:MM BRT}.
Duração total: {Xh Ymin}. Causa: {1 frase}.
Post-mortem público em até 48h.
```

**Post-mortem (48 h)**
```
Resumo público: o que aconteceu, por quê, impacto medido,
ações preventivas com owners e prazos.
Link: docs/postmortems/{AAAA-MM-DD}.md
```

---

## 🔧 Troubleshooting

### 1. Edição concorrente — HTTP 409 `CONCURRENT_EDIT`
Optimistic locking detectou versão obsoleta. Frontend mostra toast destrutivo com **Recarregar** que invalida a query. Pico anormal (>5%/min) → checar `automation_logs` para job paralelo. Logs: `concurrent_edit_detected`.

### 2. Upstream gateway 502/503/504 (Cloudflare no banco externo)
`external-data` detecta HTML de erro e retorna `{fallback:true, data:[], count:0}` com HTTP 200. UI permanece interativa. Logs: `upstream_gateway_error`. Se 100% das responses ficarem `fallback:true` → comunicar usuários.

### 3. Rate limit — HTTP 429
Limites em `_shared/rate-limit.ts` por IP. Ajustar `max`/`windowMs` na função e redeployar se usuário legítimo for afetado.

### 4. Empresa demora para carregar
Verificar `LISTING_SELECT` (não `SELECT *`), `INITIAL_FAST_LOAD = 100`, `countMethod: 'planned'`, latência via `system-health`.

### 5. Edge Function 401
Token JWT expirado → `refreshAuthToken()`. Função usa `withAuth` (não auth manual).

### 6. Edge Function CORS error
Origem deve estar em `*.lovable.app`. Confirmar `scopedCorsHeaders(req)`. OPTIONS deve incluir headers CORS.

### 7. Dados duplicados no banco externo
Constraints UNIQUE, `onConflict` correto em upserts, idempotência de webhooks (`evolution`, `bitrix24`).

### 8. Slow query >3s
Badge global aparece (`useSlowQueryIndicator`). Confirmar índices e checar `query_telemetry`.

### 9. Schema drift externo
`schema-drift-observability` loga divergências e mostra em `/admin/schema-drift`. Resiliência: hooks retornam `data: null` graciosamente.

### 10. Drift de mapping de campos
Conferir `FIELD_MAPPING.md` e UI `/admin/field-mapping`. `ai-suggest-mapping` pode propor correções.

### 11. ElevenLabs 401 (Voice AI down)
`ELEVENLABS_API_KEY` revogada/expirada. Health: `voice_ai: down`. Rotacionar secret em Lovable Cloud → Secrets.

### 12. Evolution API instance offline
Health: `whatsapp: degraded/down`. Reconectar instância em `/admin/conexoes/whatsapp`. Fallback: usuários veem aviso no módulo de Conversas.

---

## 🎚️ Feature Flags & Kill Switches

Para desabilitar módulos sem deploy, alterar `connection_configs.is_active = false`:

```sql
-- Desabilitar Lux Intelligence
UPDATE connection_configs SET is_active = false WHERE provider = 'lux';

-- Desabilitar WhatsApp sync
UPDATE connection_configs SET is_active = false WHERE provider = 'evolution';

-- Desabilitar Voice AI (UI esconde módulo se ELEVENLABS_API_KEY ausente)
-- Remover/invalidar secret em Lovable Cloud → Secrets

-- Desabilitar enriquecimento Firecrawl/EnrichLayer
UPDATE connection_configs SET is_active = false WHERE provider IN ('firecrawl','enrichlayer');
```

Frontend lê `useConnectionConfigs()` e oculta CTAs de módulos inativos. Hooks chamam `external-data` com fallback gracioso.

---

## 🔐 Segurança & Rotação de Secrets

### Inventário de secrets

| Secret | Owner | Frequência | Procedimento |
|---|---|---|---|
| `LOVABLE_API_KEY` | Lovable AI Gateway | Auto-rotacionado | — |
| `GEMINI_API_KEY` (legado) | Google AI Studio | Anual | Console Google → regenerar |
| `CRON_SECRET` | Plataforma | Trimestral | Atualizar em Cloud + cron jobs |
| `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` | Evolution API | Quando comprometido | Regenerar na Evolution |
| `ELEVENLABS_API_KEY` | ElevenLabs | Anual | Dashboard ElevenLabs |
| `EXTERNAL_SUPABASE_URL` / `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | DBA externo | Quando comprometido | Regenerar projeto externo |
| `FIRECRAWL_API_KEY` | Firecrawl | Anual | Dashboard Firecrawl |
| `ENRICHLAYER_API_KEY` | EnrichLayer | Anual | Dashboard EnrichLayer |
| `BITRIX24_WEBHOOK_SECRET` | Bitrix24 | Quando comprometido | Bitrix Inbound Webhooks |
| `LUX_WEBHOOK_SECRET` | n8n Lux | Quando comprometido | n8n credentials |
| `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` | Plataforma | A cada 2 anos | Regenerar par e atualizar service worker |

UI de auditoria: `/admin/secrets-management` (hashes SHA-256, sem expor valor).

### Checklist trimestral de segurança

| Item | Owner | Última execução |
|---|---|---|
| `npm audit` zero high/critical | Eng Lead | _registrar data_ |
| RLS em todas as tabelas novas | DBA | _registrar data_ |
| Auth guards em edge functions | Eng Lead | _registrar data_ |
| Remoção de secrets não usados | Plataforma | _registrar data_ |
| Headers de segurança em `index.html` (CSP) | Eng Frontend | _registrar data_ |
| Linter Supabase sem CRITICAL/HIGH | DBA | _registrar data_ |

Registrar evidências em `docs/security-audits/AAAA-Q{1-4}.md`.
