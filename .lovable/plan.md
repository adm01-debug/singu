

# Rodada P — Re-Auditoria e Fechamento Final 10/10

A Rodada O (19 ações) foi concluída. Agora executarei a **re-auditoria v2.7.0** para validar o score e fechar gaps remanescentes identificados.

## Fase 1 — Re-auditoria

1. Rodar `supabase--linter` e `security--run_security_scan` para confirmar zero CRITICAL/HIGH
2. Verificar bundle size, cobertura de testes, complexidade de arquivos
3. Recalcular scorecard ponderado das 20 dimensões

## Fase 2 — Gaps remanescentes (estimados)

**G1. Split `sidebar.tsx`** — ainda 746 linhas (ação 9 da Rodada O foi adiada). Quebrar em `SidebarMenu`, `SidebarGroup`, `SidebarRail` (<400 cada).

**G2. Optimistic locking — hooks** — migration aplicada (coluna `version` + trigger), mas hooks `useUpdateContact`/`useUpdateCompany` ainda não enviam `version` no `eq()`. Atualizar hooks + tratar 409 com `useActionToast.error("Conflito de edição")`.

**G3. Eliminar `:any` restantes** — varrer `src/` por `: any` e substituir por tipos concretos ou `unknown` + narrowing. Meta: <10 ocorrências justificadas.

**G4. Lighthouse-CI** — adicionar `lighthouserc.json` + step no CI com budgets (LCP<2.5s, CLS<0.1, TBT<300ms, JS<350KB gzip).

**G5. ESLint `no-explicit-any: error`** — promover regra de `warn` para `error` no `eslint.config.js` após G3.

**G6. Tracing wrapper invoke** — criar `src/lib/supabaseInvoke.ts` que envelopa `supabase.functions.invoke` injetando `X-Trace-Id` automaticamente. Substituir chamadas críticas (external-data, ask-crm, ai-suggest-mapping).

**G7. Re-aplicar tracing nas top 5 edge functions** — `external-data`, `ask-crm`, `incoming-webhook`, `ai-suggest-mapping`, `connection-anomaly-detector` usam `tracedLogger` em todos `console.log`.

## Fase 3 — Entregáveis

- **Relatório `/mnt/documents/auditoria-singu-v2.7.0.md`** — scorecard final ponderado ≥9.5/10 com evidências
- **CHANGELOG v2.7.1** — Rodada P (gaps fechados)
- **Memória atualizada** `mem://features/ux-rodada-o-auditoria-10-10` com status "concluída 10/10"

## Restrições

Português · max 400 linhas/arquivo · zero novo `any` · TanStack Query exclusivo · sem `useEffect` para fetch · reusar `useActionToast`/`EmptyState`/`RequireAdmin`.

## Critério final 10/10

(a) `tsc --noEmit` limpo, (b) `eslint --max-warnings=0` passa, (c) linter DB sem CRITICAL/HIGH, (d) security scan limpo, (e) bundle ≤350KB gzip entry, (f) cobertura ≥70% lógica crítica, (g) zero regressão visual, (h) docs operacionais completas (RUNBOOK + DR + ONBOARDING).

Aprove e executo as 7 ações de fechamento (G1–G7) + re-auditoria em sequência sem pausas até o relatório final 10/10.

