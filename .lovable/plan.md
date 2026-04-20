

# Rodada O — Continuação (ações 9–19 de 19)

Já executadas: 1–8 (RLS fixes, views públicas, CI hardening, dependabot, CONTRIBUTING, split App.tsx). Restam **11 ações** para fechar 10/10.

## 🟠 Onda 2 — Sprint 1 (continuação)

**9. Split `sidebar.tsx`** — quebrar 746 linhas em `SidebarMenu.tsx`, `SidebarSection.tsx`, `SidebarTrigger.tsx` (<400 cada).

**10. E2E Playwright no CI** — adicionar job em `.github/workflows/ci.yml`: `npx playwright install --with-deps chromium && npx playwright test` com cache `~/.cache/ms-playwright`.

**11. RLS tests SQL** — criar `tests/rls/{anon,user,admin}.sql` com SET LOCAL ROLE/JWT; runner `tests/rls/run.sh` executado no CI.

**12. Lighthouse-CI** — adicionar `@lhci/cli`, `lighthouserc.json` com budgets (LCP<2.5s, CLS<0.1, TBT<300ms), step no CI.

## 🟡 Onda 3 — Sprint 2

**13. Strict mode TS — Fase 1** — `tsconfig.app.json`: `strictNullChecks: true`; corrigir erros que aparecerem (estimativa: ~20–40 ajustes pontuais com `?.`/`??`).

**14. Optimistic locking** — migration ADD COLUMN `version INT NOT NULL DEFAULT 0` em `deals/contacts/companies` + trigger `BEFORE UPDATE` incrementando; atualizar hooks `useUpdateDeal/Contact/Company` para enviar `version` no `eq('version', current)` e tratar erro 409 com `useActionToast`.

**15. MFA banner para admins** — em `RequireAdmin`, query `auth.mfa.listFactors()`; se `enrolled.length === 0`, exibir `Alert` topo-da-página em português com CTA `/configuracoes/seguranca`.

**16. Feature flags** — migration `feature_flags(name PK, enabled bool, roles text[], description text)` com RLS (read all auth, write admin); hook `useFeatureFlag(name)` via TanStack Query (staleTime 5min); página `/admin/feature-flags` com toggle.

**17. Distributed tracing** — `src/lib/requestId.ts` (gera UUID v4 ou propaga `X-Trace-Id`); patch em `supabase.functions.invoke` wrapper; `_shared/tracing.ts` lê header e loga com `traceId` em todos `console.log` estruturados.

**18. Docs operacionais** — criar `docs/RUNBOOK.md` (severidades P0–P3, escalation, post-mortem template), `docs/ONBOARDING.md` (setup <4h, primeiros PRs sugeridos), `docs/DISASTER_RECOVERY.md` (RTO 4h / RPO 1h, passos de restore Supabase).

**19. k6 load tests** — `tests/load/{external-data,ask-crm,incoming-webhook}.js` com cenários (10 VUs ramping); `docs/LOAD_TESTING.md` com instruções.

## Entregáveis finais

- **CHANGELOG v2.7.0** — consolidação Auditoria 10/10
- **ADR-018** — strict mode + feature flags + optimistic locking
- **Memória** `mem://features/ux-rodada-o-auditoria-10-10`
- **Re-auditoria** `/mnt/documents/auditoria-singu-v2.7.0.md` (meta ≥9.5/10)

## Restrições

Português · max 400 linhas/arquivo · sem novos `any` · TanStack Query exclusivo · sem `useEffect` para fetch · reusar `EmptyState`/`useActionToast`/`RequireAdmin`.

## Critério 10/10 por ação

(a) compila, (b) console limpo, (c) verificável, (d) sem regressão, (e) RLS auditado, (f) sem secret vazado, (g) linter DB sem novo HIGH, (h) testes onde aplicável.

Aprove e executo as 11 ações restantes em sequência sem pausas até 10/10.

