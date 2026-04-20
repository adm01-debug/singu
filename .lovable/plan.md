
Status atual: **50/50 melhorias entregues** (Rodadas A–J). Para continuar evoluindo sem retrabalho, proponho **Rodada K — Observabilidade Profunda & Resiliência de Integrações (5 → 55/55)**, focada em camadas ainda não cobertas pelo módulo de Conexões.

# Rodada K — Observabilidade Profunda & Resiliência de Integrações

**1. Retry com backoff exponencial + DLQ no `incoming-webhook`** — falhas de inserção hoje só geram log. Adicionar tabela `incoming_webhook_dlq` (payload, tentativas, próximo retry, última erro) e cron `process-webhook-dlq` (a cada 5 min) que reprocessa até 5x com backoff 2^n minutos. UI em `/admin/conexoes/logs` mostra aba "Falhas pendentes" com botão "Reprocessar agora".

**2. Métricas P95/P99 + sparkline por conexão** — adicionar RPC `get_connection_metrics(connection_id, period)` que retorna `{ p50, p95, p99, success_rate, total_calls }` dos últimos 7 dias agregados por hora. `ConnectionCard` ganha sparkline inline (reusa `recharts`) + badge de saúde semáforo (verde/amarelo/vermelho) baseado em success_rate.

**3. Alertas automáticos via `smart-notifications`** — trigger DB que dispara notificação quando: (a) >5 falhas seguidas em uma conexão, (b) webhook com >10 erros em 1h, (c) latência p95 dobra vs baseline 7d. Reusa fila existente de `smart_notifications` com canal `connection_alert`.

**4. Endpoint `/health-aggregate` cacheado + status público** — adicionar cache 30s (TanStack Query staleTime) e nova rota pública `/status` (sem auth) exibindo apenas `{ system: ok|degraded|down, last_check }` para status page externa. Página admin já existente continua com detalhes completos.

**5. ADR-014 + memória `mem://features/ux-rodada-k-observabilidade-integracoes.md`** — documentar padrão DLQ, política de retry, thresholds de alerta e SLO 99.5% para webhooks. CHANGELOG v2.3.0 — Connections Observability. Consolida **55/55 melhorias**.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes (`EmptyState`, `ExternalDataCard`, `Sheet`, `useActionToast`).

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão, (e) RLS auditado.

Aprove e executo as 5 em sequência sem pausas.
