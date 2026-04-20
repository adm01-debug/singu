
# Plano: Rodar suíte completa de testes das Edge Functions

## Objetivo

Executar **todos** os testes Deno (`*_test.ts` e `*.test.ts`) de `supabase/functions/` para validar que as últimas mudanças (optimistic locking, runbook, hardening) não introduziram regressões.

## Escopo

Inventário detectado de testes:
- `_shared/version-guard_test.ts` (5 cenários — já validado isoladamente)
- `external-data/index.test.ts` (auth + CORS)
- `external-data/optimistic-locking_test.ts` (auth + conflito 409)
- `generate-insights/index.test.ts` (auth + CORS + GET reject)
- `lead-routing/index.test.ts` (12 cenários: SEC/VAL/CORS/RESP)
- `voice-to-text/index.test.ts` (auth + CORS)
- `voice-agent/index.test.ts` (auth + CORS + non-POST reject)

## Execução

Uma única chamada `supabase--test_edge_functions` **sem `functions`** (executa todos), timeout 300s.

## Análise

Após execução, classificar resultados:
- **Verdes**: contar passes e listar
- **Falhas reais**: investigar causa, distinguir entre regressão vs. teste dependente de ambiente (ex.: `optimistic-locking` requer `TEST_USER_JWT` e pula gracefully)
- **Falhas conhecidas**: o teste `optimistic-locking-stale-version` pode falhar/skipar pois confirmamos que `external-data` opera no banco externo Bitrix sem coluna `version` — isso é o bug arquitetural já reportado, não regressão desta rodada

## Entregáveis

Relatório PT-BR com:
1. Total passed/failed/skipped por arquivo
2. Stack trace das falhas (se houver)
3. Distinção: regressão nova × bug pré-existente × dependência de ambiente
4. Veredito: ✅ suíte saudável OU ❌ requer correção (com lista de ações)

## Arquivos tocados

Nenhum. Apenas execução.

## Critério de fechamento

(a) Comando executado e exit code reportado, (b) cada teste classificado, (c) recomendação clara: prosseguir vs. corrigir antes de continuar.
