# Runbook Operacional — SINGU CRM

Guia rápido para diagnosticar e responder a incidentes recorrentes.

---

## Edição concorrente (HTTP 409 — `CONCURRENT_EDIT`)

### O que é
Erro retornado pela edge function `external-data` quando dois usuários (ou abas)
tentam editar o mesmo registro simultaneamente. O sistema usa **optimistic locking**:
cada UPDATE envia a `version` atual do registro; se ela divergir do banco, o
update é rejeitado com 409.

### Quando dispara
- Action: `update_with_version` em `external-data/index.ts`
- Tabelas afetadas: `contacts`, `companies` (qualquer tabela com coluna `version`)
- Hooks que disparam: `useContacts.updateContact`, `useCompanies.updateCompany`

### Como o frontend trata
1. `src/lib/externalData.ts` lança `ConcurrentEditError` ao receber HTTP 409
2. O hook captura o erro, reverte o optimistic update e chama
   `showConcurrentEditToast({ entity, queryClient, queryKey })`
3. O usuário vê toast destrutivo com ação **Recarregar** que invalida a query
4. Em background, a query é invalidada automaticamente (mesmo sem clique)

### Como debugar
Logs estruturados emitem `traceId` em cada request. Use o `traceId` retornado
no header `x-trace-id` da resposta para correlacionar:

```bash
# Filtrar logs por traceId
supabase functions logs external-data --search "traceId=abc-123-..."
```

Cada entrada de log inclui: `level`, `fn`, `traceId`, `msg` + contexto.
Procure por `concurrent_edit_detected` para ver qual versão chegou vs. a esperada.

### Mitigação
- Usuário: clicar em **Recarregar** e refazer a edição com dados atualizados
- Operador: se houver pico anormal de 409 (>5%/min), checar se algum job
  automatizado está editando registros em paralelo com usuários humanos

---

## Upstream gateway 502/503/504 (Cloudflare)

### O que é
O banco externo retorna HTML de erro Cloudflare ao invés de JSON. A edge
function `external-data` detecta e converte para resposta degradada
`{ fallback: true, data: [], count: 0 }` com HTTP 200.

### Como o frontend trata
`src/lib/externalData.ts` reconhece `fallback: true` e retorna dataset vazio
sem disparar erro — UI permanece interativa.

### Como debugar
Buscar nos logs por `upstream_gateway_error` ou inspecionar resposta da
chamada para identificar tipo de erro (502/503/504).

---

## Rate limit (HTTP 429)

Todas as edge functions críticas usam `_shared/rate-limit.ts` (in-memory por IP).
Limites padrão estão no início de cada função (`limiter = rateLimit({...})`).

Se um usuário legítimo bate o limite, considere ajustar `max` ou `windowMs`
na função afetada e redeployar.

---

## Tracing & Correlação

### Como obter o `traceId` de uma requisição

Toda resposta das 5 edge functions críticas (`external-data`, `ask-crm`,
`ai-suggest-mapping`, `connection-anomaly-detector`, `incoming-webhook`) inclui
o header `x-trace-id` com um UUID v4 gerado por request.

```bash
curl -i -X POST "$SUPABASE_URL/functions/v1/external-data" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT" \
  -d '{"action":"select","table":"contacts","limit":1}' \
  | grep -i x-trace-id
# x-trace-id: 1f676f77-5cee-453a-827f-ba647b873c96
```

### Como buscar todos os logs de uma request específica

```bash
supabase functions logs external-data --search "traceId=1f676f77-5cee-453a-827f-ba647b873c96"
```

### Formato do log estruturado emitido

Cada entrada é uma linha JSON com os campos abaixo (exemplo real do log):

```json
{
  "level": "info",
  "traceId": "1f676f77-5cee-453a-827f-ba647b873c96",
  "fn": "external-data",
  "msg": "request_received",
  "method": "POST",
  "action": "select",
  "table": "companies"
}
```

Mensagens-chave para correlacionar incidentes:
- `request_received` — entrada de toda request (emitido pelo `tracedLogger`)
- `concurrent_edit_detected` — conflito de optimistic locking (HTTP 409)
- `upstream_gateway_error` — Cloudflare HTML detectado (HTTP 200 com `fallback:true`)
- `uncaught error` — exceção não tratada (HTTP 500)

---

## Deploy de Edge Functions

### Checklist anti-regressão

Antes de deployar uma função (manual ou automaticamente):

1. **Imports** — preferir `npm:pacote@versao` ao invés de `https://esm.sh/...`.
   O bundler do Supabase resolve `npm:` nativamente; `esm.sh` ocasionalmente
   retorna 502 e quebra o boot da função.
2. **Lock file** — se o deploy falhar com `Module not found` ou erro de bundling,
   apagar `supabase/functions/deno.lock` e redeployar. O lock será regenerado.
3. **Tracing** — toda nova função deve usar `tracedLogger(req, "<fn-name>")`
   e emitir `log.info("request_received", { ... })` no início do handler para
   garantir observabilidade desde o primeiro request bem-sucedido.
4. **Smoke test pós-deploy** — chamar a função via `supabase--curl_edge_functions`
   com um payload válido mínimo e verificar:
   - HTTP 200 (ou erro semântico esperado, ex: 401 sem JWT)
   - Header `x-trace-id` presente
   - Log `request_received` aparece em `supabase functions logs <fn>`
5. **Rollback** — em caso de regressão, reverter o arquivo via histórico do
   Lovable e redeployar. Edge functions são stateless: rollback é imediato.
