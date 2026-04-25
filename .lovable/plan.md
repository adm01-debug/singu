## Objetivo

Cobrir com testes unitários a normalização de semanas e o sort cronológico (com merge de duplicatas) hoje embutidos no `SentimentTrendChart.tsx` — incluindo formatos heterogêneos (`YYYY-MM-DD`, `...T00:00:00`, `...Z`), duplicatas que precisam ser mescladas e entradas inválidas que não podem produzir `NaN` no comparator.

## Abordagem

As funções `normalizeWeek`, `parseWeekLocal`, `isValidWeek` e `weekTimestamp`, além da lógica de merge+sort do `sortedData`, vivem hoje como funções/locais privados dentro do componente. Para testá-las sem renderizar o chart inteiro, vou extraí-las para um módulo utilitário isolado e o componente passa a importá-las. Comportamento runtime fica idêntico.

## Arquivos

### 1. Novo: `src/components/interactions/insights/weekUtils.ts`

Move e exporta:
- `ISO_WEEK_RE`
- `normalizeWeek(w)`
- `parseWeekLocal(w)`
- `isValidWeek(w)` (type guard)
- `weekTimestamp(w)` (fallback `+Infinity`)
- `normalizeAndSortWeekPoints<P>(data)` — encapsula a lógica de filtragem, merge somando `positive/neutral/negative/mixed/total` e recalculando `positivePct`, e sort por timestamp normalizado. Retorna `{ sortedData, invalidWeekCount }`. Genérico em `P extends WeekPoint` para preservar campos extras.

### 2. Editado: `src/components/interactions/insights/SentimentTrendChart.tsx`

- Remove as definições locais de `normalizeWeek`, `parseWeekLocal`, `isValidWeek`, `weekTimestamp`.
- Importa-as de `./weekUtils`.
- Substitui o `useMemo` que monta `sortedData` por uma chamada a `normalizeAndSortWeekPoints(data)`, mantendo a desestruturação `{ sortedData, invalidWeekCount }`.

### 3. Novo: `src/components/interactions/insights/__tests__/weekUtils.test.ts`

Casos cobertos:

**`normalizeWeek`**
- Trunca `2025-04-07T00:00:00` → `2025-04-07`
- Trunca `2025-04-07T03:30:00.000Z` → `2025-04-07`
- Mantém `2025-04-07` inalterado
- Devolve string vazia para `""`
- Devolve o input cru se for menor que 10 caracteres
- Devolve o input para tipos não-string (defensivo)

**`isValidWeek`**
- `true` para `2025-04-07` e `2025-04-07T00:00:00`
- `false` para `''`, `'abc'`, `'2025-13-40'`, `null`, `undefined`, `123`

**`weekTimestamp`**
- Retorna timestamp finito para semana válida
- Retorna `Number.POSITIVE_INFINITY` para `'invalid'`
- Comparator `(a,b) => weekTimestamp(a) - weekTimestamp(b)` nunca produz `NaN` mesmo com lixo

**`parseWeekLocal`**
- Data parseada tem `getFullYear/getMonth/getDate` corretos no fuso local (sem shift de -1 dia), validado via `getFullYear()` etc. em vez de `toISOString()`.

**`normalizeAndSortWeekPoints` — sort cronológico**
- Ordena entrada fora de ordem em ordem crescente
- Ordena corretamente quando entradas têm formatos mistos (`'2025-04-07'` e `'2025-04-14T00:00:00'`)
- Não usa ordenação lexicográfica: `'2025-12-29'` vem antes de `'2026-01-05'`

**`normalizeAndSortWeekPoints` — merge de duplicatas**
- Duas entradas com mesma semana (formatos diferentes) são fundidas em uma só
- `positive/neutral/negative/mixed/total` são somados
- `positivePct` é recalculado a partir do total mesclado (não copiado de uma das duplicatas)
- Resultado tem `length === 1` quando todas as entradas são da mesma semana

**`normalizeAndSortWeekPoints` — entradas inválidas**
- `null`/`undefined` no array são descartados e contam em `invalidWeekCount`
- Pontos com `week: ''` ou `week: 'lixo'` são descartados
- `invalidWeekCount` reflete o total descartado
- Entradas inválidas nunca aparecem em `sortedData`
- Quando `data` é `null`/`undefined`, retorna `{ sortedData: [], invalidWeekCount: 0 }`

## Detalhes técnicos

- Não há mudança de comportamento runtime — apenas extração para módulo separado.
- O setup de testes (`vitest.config.ts` + `src/test/setup.ts`) já existe; o novo arquivo segue o padrão dos testes em `src/test/` e `src/components/.../__tests__/`.
- Testes são puros (sem render), rodam rapidamente e não dependem de fuso horário do runner (validamos via `getFullYear/getMonth/getDate`, não `toISOString`).
- Genérico `<P extends WeekPoint>` em `normalizeAndSortWeekPoints` preserva o tipo `SentimentTrendPoint` no chart sem cast.