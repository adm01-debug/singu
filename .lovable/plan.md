
Semantic search entregue. Próxima melhoria: #15 — Conversational CRM Search (busca em linguagem natural com IA).

## Melhoria #15: Conversational Search (Ask CRM via busca)

### Escopo
Estender o `GlobalSearch` (⌘K) para aceitar perguntas em linguagem natural ("contatos de SP que não falo há 30 dias", "deals em negociação acima de 50k") e converter em filtros estruturados via Lovable AI, executando RPCs/queries reais e renderizando resultados como cards acionáveis.

### Arquitetura
- **Edge Function nova**: `conversational-search` — recebe `query`, contexto do usuário, retorna `{ intent, filters, sql_safe_params, summary }` via Gemini Flash com tool calling.
- **Tool schema**: 4 tools — `search_contacts_filtered`, `search_companies_filtered`, `search_deals_filtered`, `search_interactions_filtered` — cada uma com parâmetros tipados (cidade, dias_sem_interacao, valor_min, stage, etc.).
- **Execução client-side**: após receber filtros, hook chama queries Supabase reais com filtros aplicados.

### UI
- Toggle "💬 Pergunte" no `GlobalSearch` (3º modo ao lado de Lexical e IA Semântica).
- Quando ativo: input vira textarea com placeholder "Pergunte em linguagem natural...", botão "Buscar" explícito.
- Resultados agrupados por entidade com chip de "interpretação da IA" no topo.
- Sugestões clicáveis: "Mostrar contatos sem follow-up", "Deals quentes esta semana", "Empresas de tecnologia em SP".

### Persistência
- Histórico das últimas 10 perguntas em `localStorage` (`crm-conversational-history`).
- Cache de respostas idênticas (5 min) em `conversational_search_cache` (nova tabela leve).

### Arquivos
- Nova edge function: `supabase/functions/conversational-search/index.ts`
- Nova tabela: `conversational_search_cache` (id, user_id, query_hash, response, expires_at)
- Novo hook: `src/hooks/useConversationalSearch.ts`
- Editar: `src/components/search/GlobalSearch.tsx` (3º modo)
- Nova memória: `mem://features/conversational-crm-search.md`

### Validação E2E
- "contatos de São Paulo" → retorna lista filtrada por city
- "deals acima de 100 mil em negociação" → filtra por valor + stage
- "quem não falo há 2 semanas" → calcula dias_sem_interacao
- Cache funciona (2ª query igual = instantâneo)
- Histórico persiste entre sessões

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR, rate limit 20/min na edge function.

Após #15 → #16 (smart notifications — IA decide quando notificar e canal ideal).
