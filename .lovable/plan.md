
Status atual: **55/55 melhorias entregues** (Rodadas A–K). Para continuar a evolução sem retrabalho, proponho **Rodada L — Governança Multi-tenant & Compliance de Integrações (5 → 60/60)**, focada em camadas ainda não cobertas.

# Rodada L — Governança, Auditoria & Compliance do Módulo Conexões

**1. Auditoria completa de mudanças em `connection_configs` e `incoming_webhooks`** — adicionar trigger DB que registra em `audit_log` toda CREATE/UPDATE/DELETE de conexão e webhook (quem, quando, diff de config com secrets mascarados). Aba "Histórico" no `ConnectionFormDialog` reusa `AuditTrailViewer` existente filtrado por `entity_type='connection_config'`.

**2. Assinatura HMAC SHA-256 nos webhooks de saída + verificação no `incoming-webhook`** — gerar header `X-Lovable-Signature: sha256=<hmac>` usando `webhook_secret` por conexão. Edge function valida assinatura quando `require_signature=true` no webhook, retornando 401 em caso de mismatch. Protege contra replay com janela de 5 min via header `X-Lovable-Timestamp`.

**3. Quotas e billing por conexão** — nova tabela `connection_quotas` (`connection_id, period_start, calls_limit, calls_used, overage_blocked`). Trigger no `incoming_webhook_logs` incrementa contador; retorna 429 quando excedido. UI em `ConnectionCard` mostra barra de progresso de uso mensal + alerta a 80%.

**4. Modo "dry-run" + replay de payloads** — botão "Testar com payload real" em `IncomingWebhookLogsDialog` que reenvia payload histórico sem persistir (flag `?dry_run=true`). Útil para validar mudanças de `field_mapping` sem efeitos colaterais. Também permite "Replay" forçado (com persistência) para casos de falha humana.

**5. ADR-015 + memória `mem://features/ux-rodada-l-governanca-compliance.md`** — documentar padrão HMAC, política de retenção de logs (90d), modelo de quotas, rastreabilidade LGPD e SLA de auditoria. CHANGELOG v2.4.0 — Connections Governance. Consolida **60/60 melhorias**.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas (`AuditTrailViewer`, `EmptyState`, `Sheet`, `useActionToast`).

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão, (e) RLS auditado, (f) sem secret vazado em log.

Aprove e executo as 5 em sequência sem pausas.
