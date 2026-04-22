

# Plano: Chip de busca textual em "Últimas Interações"

## Objetivo

Adicionar um campo de busca textual no card "Últimas Interações" (Ficha 360) que filtra os itens já carregados por `assunto`/`resumo`/`channel`/`direction` e exibe um chip "Busca: 'termo' (N)" ao lado dos chips de período/canal — removível com um clique. O chip deve indicar quantas interações bateram com o termo.

## Onde encaixar

1. **Estado da query**: estender `useFicha360Filters` com `q: string`, `setQ(next)` e incluir `q` em `clear()`. Param na URL: `?q=`. Adicionar 1 ao `activeCount` quando `q` estiver preenchido (após trim).

2. **Filtragem client-side**: em `Ficha360.tsx`, derivar `filteredInteractions = useMemo(...)` aplicando `q` (case/diacritic-insensitive) sobre `recentInteractions` nos campos `assunto`, `resumo`, `channel`, `direction`. Passar isso para `UltimasInteracoesCard` em vez de `recentInteractions` cru. O `matchCount` é `filteredInteractions.length`.

3. **Input de busca**: dentro do `headerExtra` do card, antes de `FiltrosInteracoesBar`, adicionar um pequeno `<Input>` com ícone `Search` à esquerda, debounce de 200ms via `useDebouncedValue` (já existe? — checar; senão usar `setTimeout` simples). Placeholder: "Buscar por assunto, resumo, canal…". Largura responsiva (`max-w-xs`).

4. **Chip "Busca"**: estender `FiltrosAtivosChips` para aceitar prop opcional `searchTerm?: string`, `searchMatchCount?: number` e `onRemoveSearch?: () => void`. Renderizar um `Badge` `closeable` com ícone `Search`: "Busca: 'termo' · N", chamando `onRemoveSearch` no X.

5. **Ressincronizar `useFicha360DraftFilters`** (opcional): a busca **não** vai por draft — aplica imediatamente como já é padrão de search. Apenas chips de período/canais ficam em draft. (Alinhado com UX do `ActiveFiltersBar` em `/interacoes`.)

6. **Reset de paginação**: o `useInfiniteList` no card já depende de `items` (que agora muda com `q`), então a lista reinicia em 15 ao buscar — sem alteração extra. Para evitar manter `count` antigo no `sessionStorage`, incluir um hash de `q` no `filterKey`: `${days ?? 'all'}-${channelsKey || 'all'}-${qHash}`.

## Mudanças (arquivos)

- `src/hooks/useFicha360Filters.ts` — adicionar `q`, `setQ`, incluir em `clear` e `activeCount`.
- `src/pages/Ficha360.tsx` — derivar `filteredInteractions`, passar `q`, `setQ` para chips e card; passar `filteredInteractions` em vez de `recentInteractions`.
- `src/components/ficha-360/UltimasInteracoesCard.tsx` — aceitar prop `q?: string`, incluir no `filterKey` para reset de paginação. Adicionar input de busca no `headerExtra`? **Não** — o input fica em `FiltrosInteracoesBar` (próximo passo abaixo) ou direto no `headerExtra` no consumidor. Decisão: input fica em `Ficha360.tsx` dentro do `headerExtra`, antes do `FiltrosInteracoesBar`, para não inflar o card nem misturar com o draft de filtros.
- `src/components/ficha-360/FiltrosAtivosChips.tsx` — aceitar `searchTerm`, `searchMatchCount`, `onRemoveSearch`; renderizar chip `Search`.

## Não muda

- `useFicha360`, `useExternalInteractions`, `FiltrosInteracoesBar` (draft de período/canais), `useFicha360DraftFilters`, hooks de paginação, layout geral, RLS/edge functions.
- A busca é **client-side** (sobre os 50 itens já carregados via `interactionsLimit: 50`), consistente com o escopo do card.

## Critérios de aceite

(a) Campo de busca aparece no header do card "Últimas Interações"; (b) ao digitar (com debounce 200ms), a lista filtra ao vivo por `assunto`/`resumo`/`channel`/`direction`, case/diacritic-insensitive; (c) chip "Busca: 'termo' · N" aparece em `FiltrosAtivosChips` mostrando o nº de matches; (d) clicar no X do chip limpa a busca e restaura a lista; (e) "Limpar tudo" também limpa a busca; (f) o param `?q=` persiste na URL (deep-link/back/forward); (g) paginação reinicia em 15 ao mudar busca; (h) sem nova dependência, sem `any`, PT-BR, flat.

