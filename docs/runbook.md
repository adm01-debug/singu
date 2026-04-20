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
