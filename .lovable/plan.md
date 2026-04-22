

# Plano: Ordenação "Mais recente" vs "Mais relevante" em Últimas Interações

## Status

A lista em "Últimas Interações" (Ficha 360) hoje vem ordenada por data desc (`data_interacao`) direto do `useExternalInteractions`. Não há controle de ordenação na UI desta seção.

Existe `src/lib/sortInteractions.ts` com modos `recent | oldest | relevance | entity`, mas opera sobre campos `title/content/tags` — incompatíveis com `ExternalInteraction` (que usa `assunto/resumo/data_interacao`). Existe `SortChips` em `src/components/interactions/SortChips.tsx`, porém é volumoso (4 modos, atalhos Alt+R/O/M/P) e exibe texto "Mais antigas" e "Por pessoa/empresa" que não fazem sentido na Ficha 360 (1 só pessoa, queremos mínimo).

## Mudanças

### 1. `src/lib/sortInteractions.ts` — estender para suportar ExternalInteraction

Trocar `SortableItem` por uma união flexível: aceitar tanto os campos antigos (`title/content/tags`) **quanto** os novos (`assunto/resumo/channel/direction` + `data_interacao`). `getTime` já lê `date` ou `created_at` — adicionar fallback para `data_interacao`. `relevanceScore` passa a contar ocorrências em **assunto (peso 3) + resumo (peso 1) + channel/direction (peso 1)** quando `title/tags/content` ausentes. Sem breaking change: chamadas antigas continuam funcionando.

### 2. Novo: `src/hooks/useFicha360Sort.ts` (~30 linhas)

Persiste sort em URL via `useSearchParams`: `?ordem=relevante` (omitido quando = `recente`, default). Whitelist `'recente' | 'relevante'`. Retorna `{ sort, setSort }`.

### 3. Novo: `src/components/ficha-360/OrdenacaoToggle.tsx` (~70 linhas)

Toggle compacto inline (2 botões segmentados, sem dropdown):

```
[🕐 Recente] [✨ Relevante]
```

- `role="radiogroup"` + `aria-label="Ordenar por"`.
- "Relevante" desabilita (`opacity-50` + tooltip "Disponível ao buscar por palavra-chave") quando `q` está vazio. Clique vira no-op nesse caso.
- Atalho **Alt+R** (recente) / **Alt+M** (mais relevante). Toast curto "Ordenação: …".
- Mostra ícone `Info` ao lado de "Relevante" com tooltip explicando: "Pontuação por ocorrências do termo: assunto conta 3×, resumo/canal 1×. Empate desempata pela mais recente."

### 4. `Ficha360.tsx` — integração

- `const { sort, setSort } = useFicha360Sort();`
- Aplicar `sortInteractions(filteredInteractions, sort, q)` num `useMemo` antes de passar para `<UltimasInteracoesCard>`.
- Renderizar `<OrdenacaoToggle sort={sort} onChange={setSort} hasQuery={!!q.trim()} />` no `headerExtra`, **ao lado** de `CopiarLinkFiltrosButton` (linha de controles de cabeçalho).
- Quando `q` é limpo e `sort === 'relevante'`, `sortInteractions` já cai automaticamente em "recente" (via `effective`), mas sincronizamos: `useEffect` reseta `setSort('recente')` se `q` ficar vazio — evita estado fantasma na URL.

### 5. Atalhos via `useFicha360FilterShortcuts.ts`

Adicionar 2 novos no escopo `ficha360-filtros`:
- `Alt + R` → `setSort('recente')`
- `Alt + M` → `setSort('relevante')` (no-op se `!q.trim()`)

Aparecem automaticamente no cheatsheet (`?`).

## Não muda

- `useExternalInteractions` (continua trazendo ordenado por data desc no servidor — apenas reordenamos client-side).
- `useFicha360Filters`, `useFicha360DraftFilters`, `useFicha360FilterFavorites`, `FiltrosInteracoesBar`, `ContagemPorTipoBar`, `FiltrosAtivosChips`.
- `SortChips` da `Inbox` permanece intacto (lista própria de modos).
- RLS, edge functions, tabelas.
- Ordenação de favoritos: `sort` é volátil (não entra em favoritos), igual `q`.

## Critérios de aceite

(a) Toggle "Recente / Relevante" visível no header de "Últimas Interações"; (b) clique reordena a lista imediatamente; (c) "Relevante" desabilitado e em opacidade reduzida quando não há `q`; (d) sort persistido em `?ordem=relevante` (omitido quando default); (e) atalhos `Alt + R` e `Alt + M` funcionam, com toast e cheatsheet; (f) limpar a busca quando sort=`relevante` reseta para `recente` e remove `?ordem` da URL; (g) tooltip `Info` explica o cálculo; (h) `aria-pressed` correto em cada botão; (i) sem nova dependência, sem `any`, PT-BR, flat, novos arquivos <120 linhas.

