

# Plano de Testes — Rodada S (Optimistic Locking + Tracing + Migração esm.sh→npm)

Vou executar uma bateria abrangente de testes focada **exclusivamente** no que foi implementado nas Rodadas R/S e nos hotfixes recentes:

## Escopo dos Testes

### 1. Edge Functions críticas (5) — pós-migração `npm:` + tracing
Testes via `supabase--curl_edge_functions` em cada função:
- **`external-data`** — actions `select`, `insert`, `update`, `update_with_version` (sucesso e conflito 409), `delete`, `rpc`
- **`ask-crm`** — pergunta NL básica + verificação de `traceId` no response header
- **`ai-suggest-mapping`** — payload válido + payload inválido (Zod)
- **`connection-anomaly-detector`** — dispatch básico
- **`incoming-webhook`** — payload de teste

Validação: status 200/4xx esperado, header `x-trace-id` presente, JSON estruturado nos logs.

### 2. Optimistic Locking E2E (S1)
- **Cenário A — Update normal:** chamar `update_with_version` com `version` correto → 200, registro com `version+1`
- **Cenário B — Conflito:** chamar duas vezes seguidas com a mesma `version` antiga → primeira 200, segunda 409 `CONCURRENT_EDIT`
- **Cenário C — Frontend:** validar que `useUpdateContact`/`useUpdateCompany` capturam o 409 e disparam toast de conflito (inspeção de código + console)

### 3. Tracing estruturado (R1)
- Verificar via `supabase--edge_function_logs` que as 5 funções emitem JSON com `traceId`, `fn`, `level`, `msg`
- Confirmar propagação do header `x-trace-id` request→response

### 4. Saúde geral pós-migração (81 funções)
- `supabase--linter` — confirmar 0 CRITICAL/HIGH
- `security--run_security_scan` — scan completo
- Smoke test em 3 funções amostrais não-críticas (`health`, `lead-scorer`, `phone-validator`) para validar bundling `npm:` global

### 5. Sidebar modular (R4) — validação de não-regressão
- Inspeção de `src/components/ui/sidebar.tsx` (re-exports) + 4 arquivos do diretório
- Verificação visual via `browser--screenshot` da sidebar no preview (já que usuário está em `/`)
- Confirmar que imports `from '@/components/ui/sidebar'` resolvem corretamente

### 6. ESLint `no-explicit-any: warn` (R5)
- Inspeção de `eslint.config.js`
- Contagem atual de warnings via análise estática

## Entregáveis

- **Relatório detalhado** `/mnt/documents/relatorio-testes-rodada-s.md` com:
  - Tabela de cenários × resultado (✅/❌)
  - Logs capturados por função
  - Screenshots da sidebar
  - Lista de eventuais regressões encontradas
  - Score final de qualidade pós-testes

## Critério de sucesso

(a) 5 edge functions críticas respondem 200 em casos válidos e códigos esperados em casos inválidos, (b) optimistic locking devolve 409 em conflito real, (c) tracing emite JSON com `traceId` em 100% das requisições, (d) linter DB e security scan limpos, (e) sidebar visualmente intacta, (f) zero erros 500 nos smoke tests.

Aprove e executo a bateria completa, capturando evidências em cada etapa.

