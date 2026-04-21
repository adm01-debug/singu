
# Plano: Infinite scroll na aba Lista de /interacoes

## Objetivo

Substituir o carregamento único da lista em `/interacoes` por **infinite scroll** que respeita filtros avançados (q, contact, company, canais, de, ate) e ordenação atual (recent/oldest/relevance/entity), carregando lotes de 50 itens conforme o usuário rola.

## Decisão de arquitetura: client-side incremental

Os filtros (q, relevância textual) e a ordenação (relevance, entity) **dependem de campos calculados em memória** (`contact_name`, `company_name`, score por ocorrência). Refatorar para paginação server-side exigiria mudar RPC, índices e suporte a ordenação por nome de entidade — fora de escopo.

**Estratégia:** manter o fetch atual (já carrega lista completa via `useInteractions`/external view), aplicar filtros + ordenação como hoje, e **revelar progressivamente** os itens em fatias de 50 com `IntersectionObserver`. Isso resolve o problema real (DOM gigante travando scroll) sem refazer a camada de dados.

## Reutilização

- `useLazySection` (IntersectionObserver com rootMargin) — copiamos o pattern para um hook genérico
- `sortedForView` em `InteracoesContent` — array já filtrado e ordenado
- `Skeleton` de `@/components/ui/skeleton` para sentinel de loading

Sem novo fetch, sem nova RPC, sem mudança em hooks de dados.

## Arquitetura

```text
InteracoesContent
 ├─ AdvancedSearchBar (existente)
 ├─ ActiveFiltersBar (existente)
 ├─ [REFATORADO] Lista renderiza apenas sortedForView.slice(0, visibleCount)
 ├─ [NOVO] <InfiniteScrollSentinel onIntersect={loadMore} hasMore={...} />
 │     └─ usa IntersectionObserver com rootMargin "400px"
 └─ Reset visibleCount → PAGE_SIZE quando filtros/ordenação mudam
```

## Implementação

### 1. Novo hook `src/hooks/useInfiniteList.ts` (≤60 linhas)

```ts
export function useInfiniteList<T>(items: T[], pageSize = 50, deps: unknown[] = [])
  : { visible: T[]; hasMore: boolean; loadMore: () => void; sentinelRef: RefObject<HTMLDivElement> }
```

- `useState<number>(pageSize)` para contagem visível
- `useEffect` reseta para `pageSize` quando `deps` mudam (filtros, sort, q)
- `IntersectionObserver` no sentinel: ao intersectar, incrementa em `pageSize`
- `hasMore = visibleCount < items.length`
- Defensivo: `Array.isArray(items)` antes de fatiar

### 2. Novo `src/components/interactions/InfiniteScrollSentinel.tsx` (≤40 linhas)

- Props: `sentinelRef`, `hasMore`, `loading?`, `totalLoaded`, `total`
- Quando `hasMore`: renderiza 3 `Skeleton` + texto "Carregando mais…"
- Quando `!hasMore && total > 0`: texto discreto "Fim da lista — N interações exibidas"
- `React.memo`

### 3. Integração em `src/pages/interacoes/InteracoesContent.tsx`

- Importar `useInfiniteList` e `InfiniteScrollSentinel`
- Substituir uso direto de `sortedForView` na lista por `visible` retornado pelo hook
- Passar deps: `[adv.q, adv.contact, adv.company, adv.canais.join(','), adv.de, adv.ate, adv.sort]`
- Renderizar `<InfiniteScrollSentinel />` após o último item
- Manter `ActiveFiltersBar` recebendo `visibleCount={visible.length}` para o resumo "Mostrando N de M" refletir o exibido

### 4. Edge cases

- Lista <= 50 itens: sentinel mostra "Fim da lista" imediatamente, sem skeletons
- Mudança de filtro com lista grande: reset para 50 (scroll-to-top do contêiner não é forçado — preserva contexto se for ajuste fino)
- `IntersectionObserver` desconectado em cleanup
- `rootMargin: '400px'` para pré-carregar antes de chegar ao final

### 5. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray()` defensivo
- Tokens semânticos, flat
- Zero novas queries de rede
- `React.memo` no sentinel

## Arquivos tocados

**Novos (2):**
- `src/hooks/useInfiniteList.ts`
- `src/components/interactions/InfiniteScrollSentinel.tsx`

**Editados (1):**
- `src/pages/interacoes/InteracoesContent.tsx` — usar `visible` no map e montar sentinel

## Critério de fechamento

(a) Lista de `/interacoes` (aba Lista) inicia com 50 itens, (b) ao rolar próximo do fim, mais 50 são revelados automaticamente, (c) qualquer mudança em filtros ou ordenação reseta para 50, (d) sentinel mostra skeleton enquanto há mais e texto "Fim da lista" quando esgotado, (e) `ActiveFiltersBar` resumo permanece coerente com o total filtrado, (f) zero novas queries de rede, (g) zero regressão em chips, presets, ordenação ou busca.
