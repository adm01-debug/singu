
Vou executar Passo 1 (read-only) e Passos 3 e 4 (auditorias read-only). Passo 2 fica aguardando aprovação explícita.

Plano enxuto:

## Passo 1 — Validação banco externo (read-only)
- Listar secrets disponíveis (`secrets--fetch_secrets`) para confirmar nomes `EXTERNAL_SUPABASE_*`
- **Não consigo ler o valor do secret** (apenas nomes). Para confirmar o subdomínio `pgxfvjmuubtbowutlide`, vou usar a evidência indireta já documentada na memória `mem://integration/external-db/sync-strategy` que cita explicitamente esse ref, e procurar nas Edge Functions menções ao ref/URL hardcoded
- Para o ANON_KEY header (1º segmento JWT): também não tenho acesso ao valor do secret. Vou reportar isso como limitação técnica do modo read-only
- Grep `EXTERNAL_SUPABASE` em `src/` e `supabase/functions/` — listar cada arquivo + classificação (front direto vs edge function)

## Passo 3 — Auditoria `import * as`
- Rodar `code--search_files` com regex `^import \* as` em `src/` (apenas .ts/.tsx)
- Classificar cada ocorrência nos 4 buckets (A/B/C/D)
- Output formatado como pedido

## Passo 4 — Confirmação jspdf
- Rodar `code--search_files` com query `jspdf` em `src/`
- Para cada ocorrência: ler contexto e classificar Eager vs Lazy
- Se houver Eager, listar e propor commit (não aplicar — modo plano)

## Passo 2 — Remoção circuit-breakers
- **Aguarda autorização explícita.** Após "libera Passo 2", removo nas linhas:
  - `src/hooks/useInstantKpis.ts` — variável `schemaBroken` + função `isSchemaError` + flag `enabled: !schemaBroken`
  - `src/hooks/useDuplicateContacts.ts` — mesmo padrão + remover `setTimeout(5000)` artificial
- Refatorar para o esqueleto pedido (queryKey + queryFn + staleTime), mantendo `callExternalRpc` como ponte (não trocar pra `externalSupabase.rpc` direto, que não existe na base — o cliente é abstraído via Edge Function `external-data`)
- Ponto a esclarecer: o esqueleto pedido usa `externalSupabase.rpc(...)` mas a arquitetura atual usa `callExternalRpc()` da `src/lib/externalData.ts` que vai por Edge Function. Vou manter a ponte existente — trocar o transporte estaria fora do escopo do Round 1.

## Limitações que vou reportar honestamente
- Valor literal do secret `EXTERNAL_SUPABASE_URL` não é acessível por nenhuma tool disponível (só o nome). Vou reportar evidência indireta via memória + grep.
- Mesmo para o JWT header do ANON_KEY.

Aprove para eu executar Passos 1, 3 e 4 agora (read-only). Passo 2 só após "libera Passo 2".
