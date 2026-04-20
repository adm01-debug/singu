

# Rodada U — Hardening Final Sustentado (10.0/10 → 10.0/10 perpétuo)

A Rodada T fechou os gaps identificados nos testes da S. O sistema está em **10.0/10**. Para sustentar esse score sob evolução contínua, executarei 4 ações de hardening preventivo focadas em **garantias automatizadas** (não em novas features).

## Ações sequenciais

**U1. CI guard de optimistic locking**
Criar `supabase/functions/_shared/version-guard.ts` — helper reutilizável `assertVersionMatch(current, expected, entity)` que padroniza o lançamento do erro 409 `CONCURRENT_EDIT` com payload uniforme `{ error, entity, currentVersion, attemptedVersion, traceId }`. Refatorar `external-data/index.ts` action `update_with_version` para usar o helper. Benefício: qualquer nova tabela com `version` herda o contrato sem reimplementar.

**U2. Toast de conflito — cobrir hooks restantes**
Auditar via `code--search_files` todos os hooks que fazem `update_*` em entidades versionadas (`useDeals`, `useTasks`, `useInteractions` se existirem). Para cada um que ainda use toast genérico no catch de 409, trocar por `showConcurrentEditToast({ entity, queryClient, queryKey })`. Garante UX 100% consistente em conflitos de edição.

**U3. Teste E2E do fallback Cloudflare 502**
Adicionar caso novo em `optimistic-locking_test.ts` (ou novo arquivo `cloudflare-fallback_test.ts`) que simula resposta HTML do Cloudflare via mock e valida que `external-data` retorna `{ fallback: true, data: [], count: 0 }` com HTTP 200 — protege a resiliência implementada nos hotfixes recentes contra regressão futura.

**U4. Runbook — seções complementares**
Estender `docs/runbook.md` com:
- **Seção "Tracing & Correlação"** — como extrair `traceId` do header `x-trace-id` da resposta, comando `supabase functions logs <fn> --search "traceId=..."` e exemplo de payload JSON estruturado emitido pelas 5 funções críticas.
- **Seção "Deploy de Edge Functions"** — checklist anti-regressão (preferir `npm:` sobre `esm.sh`, remover `deno.lock` em caso de erro de bundling, validar com smoke test após deploy).

## Arquivos tocados

- `supabase/functions/_shared/version-guard.ts` (novo, ~25 linhas)
- `supabase/functions/external-data/index.ts` (refator do bloco `update_with_version`, ~10 linhas)
- `supabase/functions/external-data/cloudflare-fallback_test.ts` (novo, ~40 linhas)
- `src/hooks/use*.ts` que tratem 409 (refator condicional, 0–3 arquivos)
- `docs/runbook.md` (2 seções novas)

## Restrições

PT-BR · ≤400 linhas/arquivo · sem novas dependências · zero regressão visual · reuso `showConcurrentEditToast` · nenhum `useEffect` para fetch.

## Critério de fechamento

(a) `version-guard` cobre 100% das chamadas `update_with_version`, (b) busca por `409` ou `CONCURRENT_EDIT` nos hooks retorna apenas chamadas a `showConcurrentEditToast`, (c) novo teste de fallback passa em `supabase--test_edge_functions`, (d) runbook documenta tracing + deploy, (e) linter DB e security scan permanecem 0 CRITICAL/HIGH.

