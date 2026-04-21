
# Plano: Paginação progressiva em "Últimas Interações" da Ficha 360

## Status atual

`UltimasInteracoesCard` (`src/components/ficha-360/UltimasInteracoesCard.tsx`) renderiza todo o array `interactions` recebido em uma única `<ul>`. Quando há dezenas/centenas de itens (ex.: 90d sem filtro de canal), o render inicial fica pesado e o scroll engasga. Já existe a infra `useInfiniteList` + `InfiniteScrollSentinel` usadas em outras listas — vamos reaproveitá-las aqui (zero query nova, pura virtualização progressiva client-side).

## Implementação

### Arquivo: `src/components/ficha-360/UltimasInteracoesCard.tsx`

1. Importar `useInfiniteList` (`@/hooks/useInfiniteList`) e `InfiniteScrollSentinel` (`@/components/interactions/InfiniteScrollSentinel`).
2. Calcular `const { visible, hasMore, sentinelRef } = useInfiniteList(items, 15, [items])` — página inicial de 15 itens, reseta quando o array muda (troca de filtros de período/canal).
3. Renderizar `visible.map(...)` em vez de `items.map(...)`.
4. Logo após `</ul>`, montar `<InfiniteScrollSentinel sentinelRef={sentinelRef} hasMore={hasMore} totalLoaded={visible.length} total={items.length} />` para auto-load via IntersectionObserver + skeletons + rodapé "Fim da lista".
5. Manter o card sem scroll interno fixo (a lista cresce com o conteúdo). O `IntersectionObserver` do hook já dispara com `rootMargin: 400px`, então funciona dentro do scroll da página.

### Edge cases

- `items.length === 0`: `InfiniteScrollSentinel` retorna `null` (já tratado), e o `InlineEmptyState` atual continua aparecendo.
- Troca de filtros (período/canal) reseta a paginação para 15 — `deps: [items]` no hook cuida disso.
- Lista com ≤15 itens: `hasMore = false`, sentinel vira rodapé "Fim da lista — N interações exibidas".
- Sem mudança no link "Ver todas" (continua levando para `/interacoes?contact=...`).

### Padrões obrigatórios

- PT-BR
- Tokens semânticos
- Flat (sem shadow)
- Zero novas queries de rede (paginação é puramente client-side sobre o array já carregado)
- `React.memo` do componente preservado
- Zero regressão em outras seções da Ficha 360, sentimento, KPIs ou drawers

## Arquivo tocado

**Editado (1):**
- `src/components/ficha-360/UltimasInteracoesCard.tsx` — plugar `useInfiniteList(15)` + `InfiniteScrollSentinel`

## Critério de fechamento

(a) "Últimas Interações" passa a renderizar apenas 15 itens inicialmente, (b) ao rolar próximo do fim, mais 15 carregam automaticamente via IntersectionObserver, (c) skeletons aparecem durante o carregamento progressivo, (d) ao chegar ao fim, rodapé mostra "Fim da lista — N interações exibidas", (e) trocar período/canal reseta a paginação para 15, (f) zero novas queries de rede, (g) zero regressão visual ou funcional no card, no link "Ver todas" ou em outras seções da Ficha 360.
