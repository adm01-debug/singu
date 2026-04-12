# SINGU CRM — Runbook Operacional

> Guia de operações para deploy, rollback, monitoramento e resposta a incidentes.

## 📋 Índice

1. [Deploy](#deploy)
2. [Rollback](#rollback)
3. [Health Check](#health-check)
4. [Edge Functions](#edge-functions)
5. [Banco de Dados](#banco-de-dados)
6. [Monitoramento](#monitoramento)
7. [Resposta a Incidentes](#resposta-a-incidentes)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Deploy

### Frontend (Lovable)
1. Commits na branch `main` disparam deploy automático via Lovable
2. Preview builds são gerados por branch/PR em `id-preview--*.lovable.app`
3. Produção: `https://dialogue-diamond.lovable.app`

### Edge Functions
- Deploy automático ao fazer push de alterações em `supabase/functions/`
- Deploy manual via Lovable: ferramenta `deploy_edge_functions`
- Verificação pós-deploy: chamar `/functions/v1/health`

### Migrations (Banco de Dados)
1. Criar migration via ferramenta `supabase--migration`
2. Aguardar aprovação do usuário
3. Migration é executada automaticamente após aprovação
4. Verificar tipos atualizados em `src/integrations/supabase/types.ts`

---

## ⏪ Rollback

### Frontend
- Reverter para versão anterior via histórico de versões do Lovable
- Tempo estimado: < 2 minutos

### Edge Functions
- Reverter o código da função e re-deploiar
- Funções são stateless — rollback é imediato

### Banco de Dados
- Migrations são **forward-only** (sem down migrations)
- Para reverter: criar nova migration que desfaz as alterações
- **SEMPRE** fazer backup lógico antes de migrations destrutivas

---

## 🏥 Health Check

### Endpoint
```
POST /functions/v1/health
```

### Verificações realizadas
| Check | O que valida |
|-------|-------------|
| `database` | Conectividade com Supabase (tabela `profiles`) |
| `runtime` | Runtime Deno disponível |
| `external_database` | Conectividade com banco externo (se configurado) |

### Interpretação
- `200` + `status: "healthy"` → Tudo OK
- `503` + `status: "degraded"` → Verificar `checks` para identificar componente afetado

---

## ⚡ Edge Functions

### Inventário (30 funções)

| Grupo | Funções | Auth |
|-------|---------|------|
| **A — Frontend** | generate-insights, suggest-next-action, ai-writing-assistant, voice-to-text, disc-analyzer, rfm-analyzer, etc. | JWT (`withAuth`) |
| **B — Crons** | client-notifications, check-notifications, weekly-digest, check-health-alerts, template-success-notifications | `requireCronSecret` |
| **C — Health** | health | Público (sem dados sensíveis) |
| **D — S2S** | smart-reminders, send-push-notification | `withAuthOrServiceRole` |
| **E — Webhooks** | evolution-webhook, bitrix24-webhook, lux-webhook | Segredo de integração |

### Logs
- Acessar via ferramenta `edge_function_logs` com o nome da função
- Filtrar por termo de busca para debugging rápido

### Limites
- Timeout padrão: 60s (150s para funções AI)
- Tamanho máximo do payload: 6MB
- Rate limit: configurado por função

---

## 🗄️ Banco de Dados

### Conexões
| Banco | Uso |
|-------|-----|
| **Supabase Local** | Dados do app (contatos, interações, insights, etc.) — ~60 tabelas |
| **Supabase Externo** | Dados legados/corporativos (empresas, cooperativas) — ~220 tabelas |

### Queries Lentas
1. Verificar via `supabase--analytics_query`
2. Checar índices nas colunas de filtro mais usadas
3. Usar `EXPLAIN ANALYZE` para queries problemáticas

### Connection Pooling
- Supabase gerencia pooling automaticamente via PgBouncer
- Limite padrão: 60 conexões diretas / 200 via pooler

---

## 📊 Monitoramento

### Web Vitals (Frontend)
- Monitorados via `useWebVitals.ts` em produção
- Métricas: LCP, INP, CLS, FCP, TTFB
- Meta: LCP < 2.0s, CLS < 0.1

### Circuit Breaker
- Implementado em `src/lib/circuitBreaker.ts`
- Estados: CLOSED → OPEN (após falhas) → HALF_OPEN (teste) → CLOSED
- Protege chamadas ao banco externo e APIs de terceiros

### Error Reporting
- Sistema centralizado em `src/lib/errorReporting.ts`
- Deduplicação por fingerprint
- Envio em lote para minimizar overhead

---

## 🚨 Resposta a Incidentes

### Severidades

| Nível | Descrição | SLA Resposta |
|-------|-----------|-------------|
| **P1 — Crítico** | App inacessível, perda de dados | 15 min |
| **P2 — Alto** | Feature core quebrada (login, contatos) | 1 hora |
| **P3 — Médio** | Feature secundária degradada | 4 horas |
| **P4 — Baixo** | Bug visual, melhoria | Próximo sprint |

### Procedimento
1. **Identificar** — Verificar health check, logs, console do browser
2. **Comunicar** — Notificar stakeholders sobre o impacto
3. **Isolar** — Desabilitar feature via circuit breaker se necessário
4. **Corrigir** — Aplicar hotfix ou rollback
5. **Validar** — Confirmar resolução via health check + teste manual
6. **Post-mortem** — Documentar causa raiz, impacto e ações preventivas

---

## 🔧 Troubleshooting

### "Empresa demora para carregar"
1. Verificar se `LISTING_SELECT` está sendo usado (não `SELECT *`)
2. Confirmar que `INITIAL_FAST_LOAD = 100` está ativo
3. Checar latência do banco externo via health check
4. Verificar se `countMethod: 'planned'` está ativo para contagem

### "Edge Function retorna 401"
1. Verificar se o token JWT não expirou
2. Checar se o `refreshAuthToken()` está funcionando
3. Confirmar que a função usa `withAuth` (não autenticação manual)

### "Edge Function retorna CORS error"
1. Verificar se a origem está em `*.lovable.app`
2. Confirmar que `scopedCorsHeaders(req)` está sendo usado
3. Checar se a resposta de OPTIONS inclui headers CORS

### "Dados duplicados no banco externo"
1. Verificar constraints UNIQUE na tabela
2. Confirmar que upserts usam `onConflict` correto
3. Checar idempotência do webhook (evolution, bitrix24)

### "Rate limit atingido (429)"
1. Verificar `rateLimiter.ts` — janela de 15 min, 5 tentativas
2. Para API Gateway (AI): aguardar cooldown ou aumentar créditos
3. Para banco externo: verificar PgBouncer queue

---

## 🔐 Segurança

### Rotação de Secrets
| Secret | Frequência | Procedimento |
|--------|-----------|-------------|
| `CRON_SECRET` | Trimestral | Atualizar no Lovable Cloud + cron jobs |
| `EVOLUTION_API_KEY` | Quando comprometido | Regenerar na Evolution API |
| `ELEVENLABS_API_KEY` | Anual | Regenerar no dashboard ElevenLabs |
| `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` | Quando comprometido | Regenerar no projeto externo |

### Checklist de Segurança (Trimestral)
- [ ] Executar `npm audit` — zero vulnerabilidades high/critical
- [ ] Verificar RLS em todas as tabelas novas
- [ ] Auditar Edge Functions quanto a auth guards
- [ ] Revisar secrets — remover não utilizados
- [ ] Verificar headers de segurança no `index.html`
