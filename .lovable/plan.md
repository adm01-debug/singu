

# Rodada V — Hardening Preventivo de Longo Prazo (10.0/10 sustentado)

As Rodadas R/S/T/U fecharam todos os gaps táticos. Para a Rodada V, foco em **4 ações estratégicas** que blindam o sistema contra regressões futuras conforme novos módulos forem adicionados.

## Ações sequenciais

**V1. Padronizar payload `CONCURRENT_EDIT` como JSON estruturado**
Hoje `version-guard.ts` retorna `jsonError("CONCURRENT_EDIT entity=... id=... attemptedVersion=...", 409)` — string concatenada. Refatorar para emitir JSON estruturado `{ error: "CONCURRENT_EDIT", entity, id, attemptedVersion, traceId }` via novo helper `jsonConflict()` em `_shared/auth.ts`. Atualizar `src/lib/externalData.ts` `ConcurrentEditError` para parsear o novo shape mantendo retrocompatibilidade com a string atual (durante transição). Benefício: frontend ganha contexto rico (entity/id) sem regex parsing.

**V2. Teste E2E do `version-guard` helper**
Criar `supabase/functions/_shared/version-guard_test.ts` com 3 cenários:
- `assertVersionMatch([{id:'x'}], opts)` → retorna `null` (versão bateu)
- `assertVersionMatch([], opts)` → retorna `Response` 409 com payload correto
- `assertVersionMatch(null as any, opts)` → retorna 409 (defensivo)

Garante que qualquer refator futuro do helper não quebre o contrato.

**V3. Lint rule customizada — bloquear `esm.sh` em novas edge functions**
Criar script `scripts/check-edge-imports.mjs` que escaneia `supabase/functions/**/*.ts` e falha (exit 1) se encontrar `from "https://esm.sh/...`. Adicionar ao `package.json` como `"check:edge-imports"` e referenciar no runbook seção "Deploy". Previne regressão da migração `npm:` que motivou a Rodada R.

**V4. Runbook — seção "Métricas de Qualidade & SLOs"**
Adicionar em `docs/runbook.md`:
- **SLO de disponibilidade**: 99.5% das requests `external-data` retornam 200 (incluindo `fallback:true`)
- **SLO de latência**: P95 < 2s para `select`, P95 < 3s para `update_with_version`
- **Indicadores de alerta**: >5% 409/min (job concorrente), >1% 5xx/min (incidente real), 100% fallback (banco externo down)
- **Comandos de diagnóstico**: `supabase functions logs external-data --search "level=error"` + query SQL de exemplo no `query_telemetry`

## Arquivos tocados

- `supabase/functions/_shared/auth.ts` (novo helper `jsonConflict`, +15 linhas)
- `supabase/functions/_shared/version-guard.ts` (refator interno, ~5 linhas)
- `src/lib/externalData.ts` (parser robusto do erro 409, ~10 linhas)
- `supabase/functions/_shared/version-guard_test.ts` (novo, ~40 linhas)
- `scripts/check-edge-imports.mjs` (novo, ~25 linhas)
- `package.json` (1 entrada em `scripts`)
- `docs/runbook.md` (seção SLOs)

## Restrições

PT-BR · ≤400 linhas/arquivo · sem novas dependências · zero regressão visual · retrocompat com `ConcurrentEditError` atual · nenhum `useEffect` para fetch.

## Critério de fechamento

(a) `version-guard_test.ts` passa em `supabase--test_edge_functions`, (b) erro 409 chega no frontend como JSON com campos `entity`/`id` acessíveis, (c) `node scripts/check-edge-imports.mjs` retorna exit 0 no estado atual, (d) runbook documenta SLOs e comandos de diagnóstico, (e) linter DB e security scan permanecem 0 CRITICAL/HIGH.

