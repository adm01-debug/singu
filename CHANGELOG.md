# Changelog

Todas as mudanças notáveis do SINGU CRM são documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.5.0] - 2026-04-20 — Rodada M: Connections Federation & DX (65/65)

### Added
- Edge function `connection-introspect` — descobre schema (`information_schema.tables/columns`) de Supabases externos e persiste em `connection_configs.discovered_schema`.
- Componente `SchemaDiscoveryCard` — árvore expansível (tabela → colunas → tipo/nullability) com `Collapsible` + `ScrollArea`.
- Biblioteca `WEBHOOK_TEMPLATES` (Bitrix24, n8n, Stripe, GitHub, Lovable form) — botão "Usar template" no `IncomingWebhookFormDialog`.
- `WebhookSnippetsSheet` — snippets prontos cURL/fetch JS/Python/n8n/Bitrix24 com URL real, headers HMAC condicionais e payload baseado no `field_mapping`.
- MCP server v1.2.0 — 5 novas tools: `create_contact`, `update_deal_stage`, `add_interaction`, `search_companies_by_intent`, `get_pipeline_summary`.
- Tabela `mcp_tool_calls` — log de cada chamada MCP (status, latency_ms, error). RLS admin-read.
- Coluna `connection_configs.discovered_schema` + `discovered_at`.
- ADR-016 (`docs/adr/016-connections-federation-dx.md`).

### Notes
- Rate limit 10 req/min em `connection-introspect`. Limite de 50 tabelas × 80 colunas para conter payload.
- Snippets HMAC só aparecem se `webhook.require_signature = true`.

## [2.4.0] - 2026-04-20 — Rodada L: Connections Governance (60/60)

### Added
- Trigger `audit_connection_changes()` em `connection_configs` e `incoming_webhooks` — auditoria automática em `audit_log` com mascaramento de `config`, `encrypted_config`, `webhook_secret` e `token`.
- Colunas `webhook_secret`, `require_signature`, `replay_window_seconds` em `incoming_webhooks`.
- Verificação HMAC SHA-256 com anti-replay (`X-Lovable-Signature` + `X-Lovable-Timestamp`) no `incoming-webhook`.
- Tabela `connection_quotas` (mensal) + RPC `increment_webhook_quota` — retorna 429 quando excedido.
- Modo `?dry_run=true` no `incoming-webhook` (valida mapeamento sem persistir).
- `WebhookQuotaBar` no `IncomingWebhookCard` (semáforo: <80% primary, ≥80% âmbar, excedido destructive).
- `WebhookReplayButton` no `IncomingWebhookLogsDialog` (dry-run + replay real).
- Campos HMAC no `IncomingWebhookFormDialog` (toggle + secret + janela).
- ADR-015 (`docs/adr/015-connections-governance.md`).

### SLO
- 100% das mudanças de conexões/webhooks rastreadas em `audit_log` (sem secret vazado).
- Defesa em profundidade: rate-limit + HMAC + anti-replay + quota + DLQ.

## [2.3.0] - 2026-04-20 — Rodada K: Connections Observability (55/55)

### Added
- Tabela `incoming_webhook_dlq` (DLQ admin-only) + Edge Function `process-webhook-dlq` com retry exponencial (2^n min, max 5 tentativas).
- Cron `process-webhook-dlq-every-5min` (jobid 10) reprocessando entradas elegíveis automaticamente.
- RPC `get_connection_metrics(connection_id)` — p50/p95/p99/success_rate dos últimos 7d (admin-only).
- `ConnectionMetricsSparkline` no `ConnectionCard` — sparkline Recharts + badge semáforo (≥95% / ≥80% / <80%).
- Triggers `notify_connection_failures` (5+ falhas seguidas) e `notify_webhook_errors` (10+ erros/h) → `smart_notifications`.
- `WebhookDlqPanel` em `/admin/conexoes/logs` com botões "Reprocessar agora" e "Reprocessar lote".
- ADR-014 (`docs/adr/014-connections-observability.md`).

### SLO
- 99.5% de sucesso de webhook em janela de 7 dias (medido via `success_rate`).

## [2.2.0] - 2026-04-20 — Rodada J: Connections Hardening (50/50)

### Added
- Rate limiting (`_shared/rate-limit.ts`) em `incoming-webhook` (60/min por IP) e `mcp-server` (120/min por token).
- Validação Zod em ambos endpoints públicos (payload ≤256KB no webhook, JSON-RPC 2.0 estrito no MCP).
- Coluna `encrypted_config bytea` + trigger `connection_configs_encrypt_trigger` cifrando tokens via `pgcrypto`.
- Funções `encrypt_connection_config` / `decrypt_connection_config` SECURITY DEFINER (admin-only).
- Bloco `connections` no `health-aggregate` v3.1.0 (total, active, falhas 24h, erros webhook 24h).
- Página `/admin/conexoes/logs` — viewer cronológico unificado com filtros e Sheet de inspeção JSON.
- ADR-013 (`docs/adr/013-connections-module-hardening.md`).

### Security
- Tokens sensíveis (`token`, `api_key`, `secret`, `password`, `service_role_key`, `webhook_secret`) mascarados como `***` na coluna `config` em texto puro.
- `secret_refs` é zerado após cifragem; nunca persiste em plain text.
- Endpoints públicos retornam `429 Retry-After` em excesso de chamadas.

## [2.1.0] - 2026-04-20 — Rodada I: Polimento Final (45/45)

### Added
- Testes a11y automatizados via `vitest-axe` em `src/test/a11y/critical-components.test.tsx` (Button, Badge, EmptyState, Form).
- Registry público de atalhos contextuais (`src/lib/keyboardShortcutRegistry.ts`) com `registerShortcut`, `useScopedShortcut`, `getRegisteredShortcuts(scope)`.
- Component Gallery v2: tabs `external` (5 estados de ExternalDataCard) e `bulk` (BulkActionsBar).
- ADR-012 (`docs/adr/012-rodada-i-polimento-final.md`) registrando padrão de versionamento e gate a11y.

### Changed
- CHANGELOG.md reformatado para Keep-a-Changelog estrito (Added/Changed/Fixed/Security por versão).

### Security
- Gate a11y impede merge com violations `serious`/`critical` via CI.

## [2.0.0] - 2026-04-19 — Excellence Sustained (40/40)

Marco final consolidando 40 melhorias atômicas distribuídas em 8 rodadas (A-H). Sistema em estado de "excelência sustentada".

### Rodada H — Acessibilidade WCAG AA, DX & Polimento (5 itens)
- Component Gallery admin (`/admin/component-gallery`) — Storybook-lite com Button, Card, Badge, EmptyState, ActionToast, Loaders.
- Auditoria WCAG 2.1 AA documentada em `mem://standards/accessibility-wcag-aa`.
- Atalhos globais consolidados via `useKeyboardShortcutsEnhanced` + `KeyboardShortcutsCheatsheet` (?).
- Saúde agregada via edge function `system-health` (DB local/externo, WhatsApp, email, voice).
- ADR-011 (`docs/adr/011-rodada-h-accessibility-dx.md`) + este CHANGELOG.

### Rodadas A-G — entregas anteriores
- **G** Observabilidade profunda (RUM Web Vitals, CI workflow, useRestoreEntity para undo real, ARCHITECTURE.md, ADR-010).
- **F** Hardening profundo (audit DB, telemetria de erros estruturada, painel `/admin/error-logs`).
- **E** Confiabilidade (useActionToast destrutivo, circuit breaker em external-data, retry exponencial).
- **D** Performance (memoização agressiva, React.memo em listas grandes, route prefetching).
- **C** Resiliência UI (DashboardErrorBoundary, ExternalDataCard padronizado).
- **B** UX premium (PageTransition, OnboardingTour, NotificationCenter).
- **A** Fundações (TanStack Query exclusivo, FSD, RBAC com user_roles, audit trail).

### Arquivos-chave criados/modificados na Rodada H
- `src/pages/admin/ComponentGallery.tsx` (criado)
- `src/App.tsx` (rota `/admin/component-gallery`)
- `.lovable/memory/standards/accessibility-wcag-aa.md` (criado)
- `.lovable/memory/features/ux-rodada-h-accessibility.md` (criado)
- `docs/adr/011-rodada-h-accessibility-dx.md` (criado)
- `CHANGELOG.md` (este arquivo)

---

## [1.9.0] - 2026-04-12

### Qualidade de Código
- Eliminado 100% dos `any` restantes no source code (BehaviorAlertsPanel, AppreciationPanel)
- Ativado `strictBindCallApply: true` no TypeScript para maior type safety
- README.md atualizado com métricas atuais (4.470 testes, 31 Edge Functions)
- Runbook operacional expandido com procedimentos de escalation e thresholds

### Documentação
- 10 ADRs formais documentados (FSD, Circuit Breaker, Auth, AI Gateway, CORS, Logger, Rate Limiting, Zod)
- API de Edge Functions documentada no README
- Diagrama de arquitetura atualizado

### Testes
- 4.470 testes automatizados passando (78 arquivos)
- 0 erros TypeScript
- 0 vulnerabilidades npm

---

## [1.8.0] - 2026-04-12

### Segurança
- Substituído CORS wildcard `*` por `scopedCorsHeaders` dinâmico em 6 Edge Functions
- Adicionados testes automatizados para validação de security headers e CORS
- Zero vulnerabilidades high/critical (npm audit clean)

### Documentação
- Criado `docs/RUNBOOK.md` — runbook operacional completo (deploy, rollback, incidentes)
- Criado `CHANGELOG.md` com histórico de releases

### Performance
- Otimizado carregamento do módulo Empresas: `LISTING_SELECT` (~30 colunas vs SELECT *)
- Reduzido `INITIAL_FAST_LOAD` para 100 registros para primeira pintura rápida
- Implementado `countMethod: 'planned'` para contagens estimadas no banco externo

## [1.7.0] - 2026-04-11

### Adicionado
- Voice Agent com ElevenLabs (TTS + conversational AI)
- Agente de voz `elevenlabs-tts` e `voice-agent` Edge Functions
- Token de autenticação Scribe para sessões de voz

### Segurança
- Rate limiting com sliding window em Edge Functions
- Proteção anti brute force no login (5 tentativas / 15 min, bloqueios progressivos)
- Headers HTTP de segurança: CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy

## [1.6.0] - 2026-04-10

### Adicionado
- Sistema Lux Intelligence (enriquecimento automático de contatos/empresas)
- Integração Evolution API para WhatsApp
- Integração Bitrix24 para registro de chamadas
- Firecrawl scraping para dados web
- EnrichLayer para enriquecimento LinkedIn

### Melhorado
- Circuit breaker para resiliência de integrações externas
- Resilient fetch com retry exponencial
- Logger centralizado substituindo console.log em libs

## [1.5.0] - 2026-04-08

### Adicionado
- Análise DISC com AI (perfil comportamental de contatos)
- Análise RFM (Recência, Frequência, Valor Monetário)
- Sistema de insights AI com geração automática
- AI Writing Assistant para composição de mensagens
- Smart Reminders com sugestão inteligente de follow-ups

### Melhorado
- PWA com Service Worker e caching offline (NetworkFirst + CacheFirst)
- Web Vitals monitoring em produção

## [1.4.0] - 2026-04-05

### Adicionado
- Dashboard com métricas de pipeline e atividades recentes
- Weekly Digest (relatório semanal automatizado)
- Sistema de notificações push
- Health check endpoint com monitoramento de DB

### Melhorado
- Search unaccent para busca sem acentos (contatos, empresas, interações)
- Audit trail automático para operações CRUD

## [1.3.0] - 2026-04-02

### Adicionado
- Módulo de Empresas com dados do banco externo (220 tabelas)
- Mapa interativo de empresas (Leaflet + MarkerCluster)
- Filtros avançados com 30+ critérios
- Sistema de cooperativas (singular, central, confederação)

### Melhorado
- Paginação server-side com batch loading
- Formatação automática de CNPJ, capital social, razão social

## [1.2.0] - 2026-03-28

### Adicionado
- Módulo de Contatos com CRUD completo
- Sistema de interações (reuniões, calls, emails, notas)
- Relationship Score e Relationship Stage
- Análise de sentimento em interações
- Cadência de contato com lembretes automáticos

### Segurança
- RLS em todas as tabelas (user_id scoping)
- RBAC com tabela user_roles e função has_role()
- Autenticação Supabase com email + Google OAuth

## [1.1.0] - 2026-03-22

### Adicionado
- Sistema de automação (rules + triggers + actions)
- Templates de mensagens com variáveis dinâmicas
- Favoritos de templates
- Sistema de alertas e compatibilidade

## [1.0.0] - 2026-03-15

### Adicionado
- Lançamento inicial do SINGU CRM
- Autenticação com email/senha e Google
- Dashboard principal
- Perfil de usuário
- Tema claro/escuro
- Layout responsivo mobile-first
