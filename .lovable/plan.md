

# Rodada S — Fechamento Final 10.0/10 (Q1 + Q4)

A Rodada R fechou Q3 (sidebar split), Q5 (tracing 5 edge functions) e Q2 parcial (eslint warn). Score atual: **9.8/10**. Restam **2 gaps** para 10.0/10.

## Ações

**S1. Optimistic Locking — Implementação completa (Q4)**

Backend (`supabase/functions/external-data/index.ts`):
- Adicionar action `update_with_version` que recebe `{ table, id, version, patch }`
- Executa `UPDATE ... WHERE id=$1 AND version=$2 RETURNING *`
- Se 0 rows → retorna `409 { error: 'CONCURRENT_EDIT' }`
- Se 1 row → incrementa version (trigger DB já cuida) e retorna registro novo

Frontend:
- `src/hooks/useUpdateContact.ts` → aceitar `version` no input, chamar `update_with_version`, capturar 409 → `useActionToast.error("Conflito de edição: outro usuário modificou este contato. Recarregue a página.")`
- `src/hooks/useUpdateCompany.ts` → idem
- Componentes que chamam estes hooks (ContatoDetalhe, EmpresaDetalhe, formulários inline) → passar `version` atual junto com o patch

**S2. Eliminar `: any` — Fase 2 final (Q1 + Q2)**

Varrer top arquivos com `: any` restantes (~248 ocorrências) e substituir:
- Tipos de tabela → `Database['public']['Tables'][T]['Row']`
- Payloads dinâmicos → `Record<string, unknown>` + type guards
- Callbacks de events → tipos do React (`React.ChangeEvent<HTMLInputElement>`)
- RPC responses → interfaces locais com campos esperados

Meta desta rodada: **≤20 ocorrências** justificadas (esm.sh imports, libs sem types).

Após zerar: promover `eslint.config.js` `no-explicit-any` de `warn` → `error` e rodar `tsc --noEmit` + `eslint --max-warnings=0`.

## Entregáveis

- **CHANGELOG v2.7.4** — Rodada S (Q1 fechado, Q2 strict, Q4 fechado)
- **Memória atualizada** `mem://features/ux-rodada-o-auditoria-10-10` → **10.0/10 ✅**
- **Re-scan**: `supabase--linter` + `security--run_security_scan` (zero CRITICAL/HIGH)
- **Relatório final**: `/mnt/documents/auditoria-singu-v2.7.4-final.md`

## Restrições

Português · max 400 linhas/arquivo · TanStack Query · sem `useEffect` para fetch · reusar `useActionToast`/`EmptyState`/`RequireAdmin` · zero regressão visual.

## Critério final 10.0/10

(a) `tsc --noEmit` 100% limpo, (b) `eslint --max-warnings=0` com `no-explicit-any: error`, (c) linter DB sem CRITICAL/HIGH, (d) security scan limpo, (e) optimistic locking testável end-to-end (2 abas → toast de conflito), (f) zero regressão visual ou comportamental.

Aprove e executo S1 → S2 em sequência sem pausas até **10.0/10 ✅**.

