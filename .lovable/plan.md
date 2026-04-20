

# Rodada T — Polimento Final Pós-Testes (rumo ao 10.0/10 sustentado)

A bateria de testes da Rodada S validou 10/10, mas identificou **3 oportunidades de hardening** que elevam o sistema de "10/10 no papel" para "10/10 sob carga real". Executarei em sequência atômica.

## Ações

**T1. Cobertura E2E real do Optimistic Locking**
Criar arquivo de teste Deno `supabase/functions/external-data/optimistic-locking_test.ts` que:
- Faz UPDATE com versão correta → espera 200 + `version+1`
- Faz UPDATE com versão obsoleta → espera 409 + `error: 'CONCURRENT_EDIT'`
- Roda contra DB externo real via `EXTERNAL_SUPABASE_*` secrets
- Executável via `supabase--test_edge_functions`

**T2. Tracing observável — emissão proativa de `info` no boot do request**
Hoje as 5 funções críticas só emitem JSON estruturado em erros/warnings. Adicionar `logger.info('request_received', { method, action })` no início de cada handler em:
- `external-data/index.ts`
- `ask-crm/index.ts`
- `ai-suggest-mapping/index.ts`
- `connection-anomaly-detector/index.ts`
- `incoming-webhook/index.ts`

Resultado: logs históricos passam a mostrar `traceId` mesmo em requisições bem-sucedidas, fechando o gap de observabilidade detectado nos testes (logs só mostravam `Boot`/`Shutdown`).

**T3. Toast de conflito — UX padronizada**
Auditar os handlers em `useContacts.ts:164` e `useCompanies.ts:357`: garantir que ambos usem `useActionToast.destructive` com mensagem padronizada `"Edição concorrente detectada — recarregue e tente novamente"` + ação **Recarregar** que invalida a query relevante. Hoje cada hook tem seu próprio toast ad-hoc.

Criar helper compartilhado `src/lib/concurrentEditToast.ts` que recebe `{ queryKey, refetch }` e dispara o toast padronizado — reuso garante consistência se outros hooks adotarem optimistic locking no futuro.

**T4. Documentação de runbook**
Adicionar seção **"Edição concorrente"** em `docs/runbook.md` (ou criar se não existir) descrevendo:
- O que dispara o erro 409
- Como o frontend trata (toast + refetch)
- Como debugar via `traceId` nos logs do edge

## Arquivos tocados

- `supabase/functions/external-data/optimistic-locking_test.ts` (novo)
- `supabase/functions/{external-data,ask-crm,ai-suggest-mapping,connection-anomaly-detector,incoming-webhook}/index.ts` (1 linha cada)
- `src/lib/concurrentEditToast.ts` (novo, ~30 linhas)
- `src/hooks/useContacts.ts` + `src/hooks/useCompanies.ts` (refatoração do bloco do catch)
- `docs/runbook.md` (seção nova)

## Restrições

PT-BR · ≤400 linhas/arquivo · TanStack Query · sem `useEffect` para fetch · reuso `useActionToast` · zero regressão visual.

## Critério de fechamento

(a) `supabase--test_edge_functions` passa nos 2 cenários de optimistic locking, (b) logs históricos das 5 fns mostram entradas `request_received` com `traceId`, (c) toast de conflito unificado nos 2 hooks com ação **Recarregar**, (d) runbook documentado, (e) zero regressão no linter/security.

