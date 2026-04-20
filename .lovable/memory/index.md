# Project Memory

## Core
Português obrigatório em respostas, documentação e UI.
Max 400 linhas por arquivo. Sem `any`. TanStack Query exclusivo. Sem `useEffect` para fetch.
Dark/Light theme com tokens HSL semânticos. Nunca usar cores diretas em componentes.
Lovable Cloud (Supabase) com RLS em todas as tabelas. RBAC via `user_roles` + `has_role()`.
Edge functions usam `Deno.serve()` + scopedCorsHeaders. Nunca raw SQL via RPC.
Não implementar módulos de Produtos nem Propostas (escopo proibido).
Excelência sustentada: 65/65 melhorias atômicas (Rodadas A-M). Gate a11y no CI.

## Memories
- [Rodada M — Federação & DX](mem://features/ux-rodada-m-federacao-dx) — 65/65: schema discovery via information_schema, templates de webhook (Bitrix/n8n/Stripe/GitHub), snippets cURL/JS/Python/n8n, MCP v1.2.0 com 5 novas tools, ADR-016.
- [Rodada L — Governança Conexões](mem://features/ux-rodada-l-governanca-compliance) — 60/60: auditoria com mascaramento, HMAC SHA-256 + anti-replay, quotas mensais (429), dry-run/replay, ADR-015.
- [Rodada K — Observabilidade Conexões](mem://features/ux-rodada-k-observabilidade-integracoes) — 55/55: DLQ + retry exponencial, sparkline P50/95/99, alertas em smart_notifications, SLO 99.5%, ADR-014.
- [Connections Module](mem://features/connections-module) — /admin/conexoes: integrações Supabase/Bitrix24/n8n/MCP Claude + webhooks entrantes com tester, logs e MCP server JSON-RPC.
- [Rodada I — Polimento Final](mem://features/ux-rodada-i-polimento-profundo) — 45/45: testes axe, registry de atalhos, Gallery v2, health-aggregate, ADR-012.
- [Rodada H — Acessibilidade WCAG AA](mem://features/ux-rodada-h-accessibility) — 40/40: SkipNav, RouteAnnouncer, useAccessibleToast, foco visível.
- [Standards — Accessibility WCAG AA](mem://standards/accessibility-wcag-aa) — Auditoria documentada de superfícies críticas.
- [System Health Check](mem://features/system-health-check) — Edge function `system-health` + widget admin + `/status` público.
- [User preferences](mem://~user) — Execução autônoma e sequencial de melhorias.
