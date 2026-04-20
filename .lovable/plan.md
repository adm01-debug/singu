

# Auditoria Técnica Exaustiva — SINGU CRM v2.6.0

Sistema em **70/70 melhorias** (Rodadas A–N). Executarei a auditoria completa nas 20 dimensões sem modificar código (apenas leitura profunda).

## Fase 0 — Inventário
- Repositório: SINGU CRM (Lovable Cloud + Supabase)
- Stack: React 18 + Vite 5 + TS 5 + Tailwind v3 + TanStack Query + Deno Edge Functions
- Integrações: Evolution API (WhatsApp), Google Workspace, Bitrix24, ElevenLabs, Gemini/Lovable AI, Firecrawl, EnrichLayer, n8n (Lux)
- Ambientes: dev + preview + published (dialogue-diamond.lovable.app)
- Escopo: ~800 arquivos .ts/.tsx, ~280 hooks, ~60 Edge Functions, ~100+ tabelas, ~70 rotas

## Fase 1 — Coleta de evidências
Leitura dirigida de:
1. `src/App.tsx`, `src/hooks/useAuth.tsx`, `src/lib/{logger,errorReporting,circuitBreaker,resilientFetch,validationSchemas,externalData}.ts`
2. `supabase/functions/_shared/{auth,rate-limit,validation}.ts`, `external-data`, `incoming-webhook`, `ai-suggest-mapping`, `connection-anomaly-detector`, `mcp-server`
3. Migrations críticas (RLS, audit_log, user_roles, connection_anomalies, mcp_tool_calls)
4. `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `eslint.config.js`, `.github/workflows/ci.yml`
5. `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, ADRs 001–017, CHANGELOG
6. Testes: `security-hardening.test.ts`, e2e Playwright, scripts/check-bundle-size.mjs
7. `supabase--linter` (checagem automatizada de RLS/segurança DB)
8. `security--run_security_scan` (scan backend completo)

## Fase 2 — Avaliação das 20 dimensões
Cada dimensão receberá:
- **Nota 0–10** com justificativa
- **Evidências** (arquivo:linha quando aplicável)
- **Gaps para 10/10** objetivos
- **Ações corretivas** concretas (código/config/migration)

Peso crítico ×3: Segurança, Auth, Autorização, Data Integrity
Peso alto ×2: Banco, Tipagem, Validação, Testes, Arquitetura
Peso padrão ×1: demais

## Fase 3 — Entregáveis consolidados
1. **Scorecard** (tabela 20×3) com notas e gap principal
2. **Nota geral ponderada** (média ponderada por criticidade)
3. **Top 10 ações por ROI** (impacto/esforço)
4. **Roadmap 3 ondas**:
   - 🔴 Quick Wins (1–3 dias)
   - 🟠 Sprint 1 (1–2 semanas)
   - 🟡 Sprint 2 (2–4 semanas)
5. **Comentário final** sobre maturidade geral
6. **Relatório exportável** em `/mnt/documents/auditoria-singu-v2.6.0.md`

## Regras aplicadas
- Nota 10 **só com evidência de zero gap**
- Sem achismo — cada nota cita arquivo/config
- Ações concretas (código, migration, config), não genéricas
- Caminho incremental: 4→6→8→10 por dimensão quando cabível
- Output em **português**, reusando padrões existentes (`EmptyState`, `useActionToast`, `ExternalDataCard`)

## Formato de saída final
Documento único em chat + artifact `.md` em `/mnt/documents/` para download.

Aprove e executo a auditoria completa (read-only + scan linter + security scan) e entrego o relatório consolidado em uma única resposta.

