# Project Memory

## Core
Português obrigatório em respostas, documentação e UI.
Max 400 linhas por arquivo. Sem `any`. TanStack Query exclusivo. Sem `useEffect` para fetch.
Dark/Light theme com tokens HSL semânticos. Nunca usar cores diretas em componentes.
Lovable Cloud (Supabase) com RLS em todas as tabelas. RBAC via `user_roles` + `has_role()`.
Edge functions usam `Deno.serve()` + scopedCorsHeaders. Nunca raw SQL via RPC.
Não implementar módulos de Produtos nem Propostas (escopo proibido).
Excelência sustentada: 45/45 melhorias atômicas (Rodadas A-I). Gate a11y no CI.

## Memories
- [Connections Module](mem://features/connections-module) — /admin/conexoes: integrações Supabase/Bitrix24/n8n/MCP Claude + webhooks entrantes com tester, logs e MCP server JSON-RPC.
- [Rodada I — Polimento Final](mem://features/ux-rodada-i-polimento-profundo) — 45/45: testes axe, registry de atalhos, Gallery v2, health-aggregate, ADR-012.
- [Rodada H — Acessibilidade WCAG AA](mem://features/ux-rodada-h-accessibility) — 40/40: SkipNav, RouteAnnouncer, useAccessibleToast, foco visível.
- [Standards — Accessibility WCAG AA](mem://standards/accessibility-wcag-aa) — Auditoria documentada de superfícies críticas.
- [System Health Check](mem://features/system-health-check) — Edge function `system-health` + widget admin + `/status` público.
- [User preferences](mem://~user) — Execução autônoma e sequencial de melhorias.
