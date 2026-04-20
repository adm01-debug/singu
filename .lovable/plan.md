
Status atual: **60/60 melhorias entregues** (Rodadas A–L). Para continuar evoluindo o módulo de Conexões sem retrabalho, proponho **Rodada M — Federação, Schema Discovery & Developer Experience (5 → 65/65)**.

# Rodada M — Federação, Schema Discovery & DX

**1. Schema discovery automático nas conexões Supabase externas** — botão "Descobrir schema" em `ConnectionCard` (tipo `supabase_external`) que chama nova edge function `connection-introspect` usando `service_role_key`. Lista tabelas/colunas via `information_schema` e popula um JSON `discovered_schema` em `connection_configs`. UI mostra árvore expansível (tabelas → colunas → tipos) reusando `ScrollArea` + `Collapsible`. Útil para configurar `field_mapping` de webhooks sem advinhação.

**2. Templates de webhook por sistema de origem** — biblioteca `WEBHOOK_TEMPLATES` (Bitrix24, n8n, Stripe, GitHub, genérico Lovable) com `field_mapping` e `target_entity` pré-configurados. Botão "Usar template" em `IncomingWebhookFormDialog` aplica mapping com 1 clique. Acelera onboarding de novas integrações de minutos para segundos.

**3. Playground OpenAPI/cURL generator** — em cada `IncomingWebhookCard`, botão "Ver exemplos" abre `Sheet` com snippets prontos: cURL, fetch JS, Python requests, n8n HTTP node config, Bitrix24 outbound webhook. Snippets já incluem URL, headers HMAC (se ativo), payload de exemplo do `field_mapping` e timestamp atual. Copy-to-clipboard por bloco.

**4. MCP server expandido com 5 novas tools** — adicionar ao `mcp-server`: `create_contact`, `update_deal_stage`, `add_interaction`, `search_companies_by_intent`, `get_pipeline_summary`. Cada tool com Zod schema, validação de permissão por token e log em `mcp_tool_calls` (nova tabela). Documentação inline auto-gerada via `tools/list`.

**5. ADR-016 + memória `mem://features/ux-rodada-m-federacao-dx.md`** — documentar padrão de introspection, formato de templates, contrato MCP estendido. CHANGELOG v2.5.0 — Connections Federation & DX. Consolida **65/65 melhorias**.

## Restrições mantidas
Português, max 400 linhas/arquivo, sem `any`, TanStack Query exclusivo, sem `useEffect` para fetch, reusar primitivas (`Sheet`, `Collapsible`, `ScrollArea`, `EmptyState`).

## Critério 10/10 por etapa
(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão, (e) RLS auditado, (f) sem secret vazado, (g) edge function testada via curl.
