
# Plano: Ordenação da lista em /interacoes

## Objetivo

Adicionar um seletor de ordenação na lista de `/interacoes` com 4 opções: **Mais recentes** (padrão), **Mais antigas**, **Melhor correspondência** (relevância da busca textual) e **Por pessoa/empresa** (alfabética). A ordenação persiste na URL e é compatível com todos os filtros avançados existentes.

## Reutilização

- `useInteractionsAdvancedFilter` — adicionar campo `sort` ao state da URL (`?sort=`)
- `useDebounce` (já em uso para `q`) para o termo de busca
- Padrão visual `Select` (shadcn) já presente no projeto

Sem nova tabela, sem novo fetch, sem nova RPC.

## Arquitetura

```text
AdvancedSearchBar
 ├─ Input + chips canal + filtros (existente)
 └─ [NOVO] SortSelect (Select shadcn) — ao lado de "Limpar tudo"
       └─ valores: 'recent' | 'oldest' | 'relevance' | 'entity'

useInteractionsAdvancedFilter
 ├─ filters.sort: SortKey ('recent' default)
 └─ setFilter('sort', value)

Página /interacoes (consumidor)
 └─ useMemo aplicando sortInteractions(items, sort, q)
       ├─ recent  → date desc
       ├─ oldest  → date asc
       ├─ relevance (só ativo se q != '') → score por ocorrências em title/content/tags + recência como tiebreaker
       └─ entity  → contact_name || company_name (localeCompare pt-BR)
```

## Implementação

### 1. `useInteractionsAdvancedFilter.ts`

- Adicionar `sort: SortKey` ao tipo `AdvancedFilters` (default `'recent'`)
- Incluir `'sort'` no array `KEYS`
- `setFilter` aceita string; persiste/remove no URLSearchParams
- `activeCount` **não conta** `sort` (ordenação não é filtro)

### 2. Novo `src/lib/sortInteractions.ts` (≤120 linhas, função pura)

```ts
export type SortKey = 'recent' | 'oldest' | 'relevance' | 'entity';

export function sortInteractions<T extends {
  date?: string | Date | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  contact_name?: string | null;
  company_name?: string | null;
}>(items: T[], sort: SortKey, query?: string): T[]
```

- Defensivo com `Array.isArray` e fallback para campos nulos
- `relevance`: contagem de ocorrências case-insensitive do termo em title (×3), tags (×2) e content (×1); empate desfaz pela data desc
- Se `sort === 'relevance'` e `query` vazio, faz fallback para `'recent'`
- `entity`: `contact_name ?? company_name ?? ''`, `localeCompare('pt-BR')`

### 3. Novo componente `SortSelect.tsx` (≤60 linhas)

`src/components/interactions/SortSelect.tsx`

- Props: `value: SortKey`, `onChange`, `hasQuery: boolean`
- `Select` shadcn, ícone `ArrowUpDown`, label oculto em mobile
- Opção "Melhor correspondência" desabilitada quando `!hasQuery` (com `title` explicativo)
- `React.memo`

### 4. Integração em `AdvancedSearchBar.tsx`

- Adicionar `<SortSelect value={filters.sort} onChange={(v) => setFilter('sort', v)} hasQuery={!!filters.q.trim()} />` antes do menu de presets
- `InteracoesPresetsMenu`: incluir `sort` no payload salvo/aplicado (mantém compatibilidade — presets antigos sem `sort` preservam o atual)

### 5. Aplicação na página consumidora

Localizar a página/componente que renderiza a lista (provavelmente `src/pages/Interacoes.tsx` ou `UnifiedTimelineView` no contexto avançado) e envolver os itens com `useMemo(() => sortInteractions(items, filters.sort, debouncedQ), [items, filters.sort, debouncedQ])`.

### 6. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` defensivo
- Tokens semânticos, flat design
- Persistência URL (`?sort=`)
- Compatível com presets, filtros e canais

## Arquivos tocados

**Novos (2):**
- `src/lib/sortInteractions.ts`
- `src/components/interactions/SortSelect.tsx`

**Editados (3):**
- `src/hooks/useInteractionsAdvancedFilter.ts` — campo `sort` na URL
- `src/components/interactions/AdvancedSearchBar.tsx` — incluir `SortSelect`
- `src/pages/Interacoes.tsx` (ou consumidor da lista) — aplicar `sortInteractions` via `useMemo`
- `src/components/interactions/InteracoesPresetsMenu.tsx` — incluir `sort` no payload de presets

## Critério de fechamento

(a) Seletor de ordenação visível na barra de busca de `/interacoes` com 4 opções, (b) "Mais recentes" como padrão, (c) "Melhor correspondência" desabilitada sem termo de busca, (d) ordenação aplicada na lista renderizada via função pura testável, (e) estado persiste em URL (`?sort=`) e em presets, (f) `activeCount` não conta `sort`, (g) zero novas queries de rede, (h) zero regressão em filtros, presets ou paginação.
