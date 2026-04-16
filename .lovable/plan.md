
## Plano: extração de schema SINGU para migração

### Objetivo
Rodar 6 queries SQL via `supabase--read_query` no Supabase deste projeto (rqodmqosrotmtrjnnjul) e colar os JSONs brutos no chat entre tags `<<<QUERY_N_START>>>` / `<<<QUERY_N_END>>>`, sem criar memories, sem escrever código, sem alterar arquivos.

### Execução
1. **QUERY 1** — Colunas (information_schema.columns) → JSON de ~300-500 KB
2. **QUERY 2** — Foreign Keys → JSON pequeno
3. **QUERY 3** — Enums (pg_type) → JSON pequeno
4. **QUERY 4** — Functions plpgsql/sql com `pg_get_functiondef` → JSON médio
5. **QUERY 5** — Triggers + RLS policies + tabelas com RLS habilitado (json_build_object) → JSON médio
6. **QUERY 6** — Indexes + Unique constraints + Check constraints (json_build_object) → JSON médio

### Estratégia de tamanho
- Tento cada query inteira primeiro.
- Se QUERY 1 estourar limite de output, divido por faixa alfabética de `table_name` (`^[a-h]`, `^[i-r]`, `^[s-z]`) e uso `<<<QUERY_1_PART_N_START/END>>>`.
- Se QUERY 4 estourar (functions com definitions longas), divido em 2 partes por faixa alfabética de `proname`.

### Fallbacks
- Se `supabase--read_query` bloquear acesso a `pg_catalog` (pg_proc/pg_trigger/pg_policies), reporto qual query falhou entre as tags com `ERROR: ...` e sigo com as demais.
- Se houver erro de sintaxe, reporto idem e continuo.

### Output
Uma única mensagem de chat com os 6 blocos delimitados, JSON bruto puro dentro de cada bloco, sem markdown extra, sem comentários interpretativos, sem follow-up perguntando confirmação.

### O que NÃO farei
- Não uso `code--exec` / psql.
- Não crio memories em `mem://migration/*`.
- Não escrevo código TypeScript, não toco em arquivos da aplicação, não faço deploy.
- Não respondo em múltiplas mensagens nem peço confirmação intermediária.

Aprovar para executar.
