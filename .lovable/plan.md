

# Rodada O — Execução da Auditoria 10/10 (19 ações em 3 ondas)

Executarei as **19 ações** do roadmap da auditoria v2.6.0 **uma por uma**, em sequência, até fechar 10/10. Cada ação é atômica, auditável e reusa primitivas existentes.

## 🔴 Onda 1 — Quick Wins (ações 1–6)

1. **Fix RLS `mcp_tool_calls`** — DROP + recreate INSERT policy com `WITH CHECK (true)` para `service_role`. Corrige logging silenciosamente quebrado.
2. **RLS `login_attempts`** — restringir INSERT a `service_role` apenas; bloquear poluição por usuários autenticados.
3. **Mover extensões para schema `extensions`** — `CREATE SCHEMA extensions`; `ALTER EXTENSION pg_trgm SET SCHEMA extensions` (+ demais detectadas pelo linter).
4. **Endurecer CI** — adicionar em `.github/workflows/ci.yml`: `npm run lint` (ESLint), `npm audit --omit=dev --audit-level=high`, `vitest --coverage` com threshold 70%, cache de deps.
5. **Dependabot** — criar `.github/dependabot.yml` semanal (npm + github-actions).
6. **CONTRIBUTING.md** — Git flow (trunk-based), convenção de commits, SLA de review, checklist de PR.

## 🟠 Onda 2 — Sprint 1 (ações 7–12)

7. **Views públicas scoped** — migrations criando `csat_surveys_public`, `forms_public`, `landing_pages_public`, `document_signatures_public` com apenas colunas seguras + RLS anon via token/expiração. Atualizar hooks que leem anon.
8. **Splitar arquivos grandes** — `App.tsx` (860→<400) em `AppProviders.tsx` + `AppRouter.tsx`; `sidebar.tsx` (746→<400) em subcomponentes (`SidebarMenu`, `SidebarSection`).
9. **E2E Playwright no CI** — step `npx playwright install --with-deps && npx playwright test` com cache dos browsers.
10. **RLS tests SQL** — `tests/rls/*.sql` executados via `psql` no CI com JWTs de roles diferentes (admin/user/anon).
11. **Lighthouse-CI** — `@lhci/cli` no pipeline com budget LCP<2.5s, CLS<0.1, TBT<300ms.
12. **Sentry free tier OU consolidação in-app** — integrar `@sentry/react` + `@sentry/deno` com sampling 10%, `beforeSend` redigindo PII. Fallback: manter `/admin/error-logs`.

## 🟡 Onda 3 — Sprint 2 (ações 13–19)

13. **Strict mode TS em fases** — `tsconfig.app.json`: ativar `strictNullChecks: true`; corrigir erros; depois `noImplicitAny: true`; eliminar 66 `:any` (regra ESLint `no-explicit-any: error`).
14. **Optimistic locking** — migration `ALTER TABLE deals/contacts/companies ADD COLUMN version INT NOT NULL DEFAULT 0` + trigger `BEFORE UPDATE` incrementando; hooks enviam `version` no update e tratam conflito 409.
15. **MFA obrigatório admin** — banner em `RequireAdmin` quando `mfa_enrolled=false`; policy opcional bloqueando escritas sensíveis sem MFA.
16. **Feature flags** — tabela `feature_flags(name text pk, enabled bool, roles text[])` + hook `useFeatureFlag(name)` + painel `/admin/feature-flags`.
17. **Distributed tracing** — helper `requestId.ts` gera/propaga `X-Trace-Id`; todas edge functions logam com traceId; frontend envia header em `supabase.functions.invoke`.
18. **Runbook + Onboarding + DR** — `docs/RUNBOOK.md` (incidente, escalation, severidade), `docs/ONBOARDING.md` (produtivo em <4h), `docs/DISASTER_RECOVERY.md` (RTO/RPO, passos de restore).
19. **Teste de carga k6** — scripts `tests/load/*.js` para `external-data`, `ask-crm`, `incoming-webhook`; guia em `docs/LOAD_TESTING.md`.

## Entregáveis finais

- **CHANGELOG v2.7.0** — Auditoria 10/10 consolidada.
- **ADR-018** — decisões de hardening (strict mode, feature flags, optimistic locking).
- **Memória** `mem://features/ux-rodada-o-auditoria-10-10.md`.
- **Relatório de re-auditoria** `/mnt/documents/auditoria-singu-v2.7.0.md` com notas atualizadas (meta: **≥9.5/10 ponderado**).

## Restrições mantidas

Português · max 400 linhas/arquivo · sem `any` (progressivo via strict mode) · TanStack Query exclusivo · sem `useEffect` para fetch · reusar primitivas (`EmptyState`, `useActionToast`, `RequireAdmin`).

## Critério 10/10 por ação

(a) compila, (b) console limpo, (c) feature verificável, (d) sem regressão, (e) RLS auditado (re-scan), (f) sem secret vazado, (g) linter DB sem CRITICAL/HIGH novo, (h) testes adicionados/atualizados onde aplicável.

Aprove e executo as 19 ações em sequência, sem pausas, até 10/10.

