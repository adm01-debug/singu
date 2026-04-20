
Plano aprovado anteriormente: **Rodada J — Hardening do Módulo de Conexões & Polimento Final (5 melhorias → 50/50)**

Foco: endurecer o módulo de Conexões recém-criado (que ainda tem gaps críticos de segurança e UX) antes de declarar 10/10.

**1. Rate limiting + validação Zod no `incoming-webhook` e `mcp-server`** — hoje ambos estão públicos sem limite por IP. Adicionar `rateLimiter` compartilhado (60 req/min por IP no incoming, 120 req/min por token no MCP) e schema Zod para o payload do MCP (`initialize`/`tools/call`). Retorna 429 com `Retry-After`.

**2. Criptografia de secrets em `connection_configs`** — hoje `secret_refs` e `config` guardam tokens em texto puro no JSONB. Migrar para coluna `encrypted_config bytea` usando `pgsodium` (ou `pgcrypto` com chave do Vault), com helpers `encrypt_connection_config()` / `decrypt_connection_config()` SECURITY DEFINER. UI continua transparente; edge functions descriptografam via RPC.

**3. Health check do módulo Conexões integrado ao `health-aggregate`** — adicionar bloco `connections: { total, active, last_test_failures_24h, webhooks_with_errors_24h }` ao endpoint `health-aggregate` e card no `/admin/system-health`.

**4. Tela de logs unificada `/admin/conexoes/logs`** — viewer cronológico que mescla `connection_test_logs` + `incoming_webhook_logs` com filtros (tipo, status, período), badge de latência e expansão JSON do payload. Reusa primitivas `EmptyState`, `ExternalDataCard`, `Sheet`.

**5. Documentação + ADR-013** — criar `docs/adr/013-connections-module-hardening.md`, atualizar `CHANGELOG.md` (v2.2.0 — Connections Hardening), `mem://features/connections-module.md` com seção "Hardening" e `mem://features/ux-rodada-j-connections-hardening.md` consolidando **50/50 melhorias**.

## Restrições
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas existentes. Critério 10/10 por etapa: (a) compila, (b) console limpo, (c) verificável, (d) sem regressão.

Aprove e executo as 5 em sequência sem pausas.
