

# Plano: Resumo de evolução de % positivo no topo do chart

## Diagnóstico

- O `SentimentTrendChart.tsx` já mostra um badge "Melhorando/Estável/Piorando" com `summary.deltaPct`, mas esse delta vem do hook (`useInteractionsInsights`) e representa a variação **dentro** da janela atual (ex.: primeira vs. última semana), não uma comparação com o **período anterior** equivalente.
- Os dados disponíveis localmente em `data: SentimentTrendPoint[]` permitem calcular essa comparação sem mexer no hook: dividir as semanas em duas metades (mais antiga = "período anterior", mais recente = "período atual") e comparar o `% positivo` médio ponderado pelo volume (`positive / total`).
- Sinal será determinístico, derivado puramente de `data` (sem novas dependências, sem mudanças em hooks).

## O que será construído

Adicionar uma faixa de **resumo de evolução** acima do chart, com:

- Ícone de direção (↑ subiu / − estável / ↓ desceu) baseado no delta vs. período anterior.
- "% positivo atual" e "% positivo anterior" lado a lado.
- Delta em `pp` (pontos percentuais) com cor semântica (success/muted/destructive).
- Texto curto de contexto: "vs. {N} semanas anteriores".

### Mudanças em `src/components/interactions/insights/SentimentTrendChart.tsx`

1. Novo `useMemo` `evolutionStats` que:
   - Divide `data` em duas metades por índice (`Math.floor(data.length / 2)`).
   - Calcula `% positivo` ponderado de cada metade: `sum(positive) / sum(total)` × 100.
   - Retorna `{ currentPct, previousPct, deltaPp, direction, weeksCompared }`.
   - Threshold de "estável": `|deltaPp| < 3` → `stable`; `> 0` → `up`; `< 0` → `down`.
   - Quando `data.length < 4` ou alguma metade tem `total = 0`, retorna `null` (oculta a faixa).
2. Nova faixa renderizada **acima** do bloco `summary` existente (ou no lugar dele se `summary` ausente), em uma `div` flat com:
   - Ícone (TrendingUp/Minus/TrendingDown) + label ("Subiu" / "Estável" / "Desceu") em cor semântica.
   - Bloco "Atual: X% · Anterior: Y%" em texto pequeno tabular-nums.
   - Badge `+Zpp` / `−Zpp` / `0pp` à direita, mesmo padrão de cores do badge atual.
   - Subtexto cinza: "vs. {weeksCompared} semanas anteriores".
3. Manter o badge atual de tendência interna (já existente) — são dois sinais complementares: o badge é "trend dentro da janela", a nova faixa é "atual vs. anterior".
4. Sem mudanças em `useInteractionsInsights.ts`, tipos públicos, hooks, ou outros componentes.

## Critérios de aceite

(a) Acima do chart aparece uma faixa de resumo com ícone direcional, % positivo atual, % positivo anterior, delta em `pp` e legenda "vs. N semanas anteriores"; (b) cores seguem padrão semântico (success/muted/destructive) consistente com o resto do chart; (c) faixa só renderiza quando há ≥ 4 semanas e ambas as metades têm volume > 0 (caso contrário fica oculta sem quebrar layout); (d) cálculo é ponderado por volume (não média simples de %), refletindo realidade quando semanas têm volumes muito distintos; (e) badge "Melhorando/Estável/Piorando" existente é preservado; (f) sem mudanças em hooks, agregação, tipos públicos, stat cards (Melhor/Pior/Conversas/Mistos), tooltip ou outros componentes; (g) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (h) arquivo permanece ≤300 linhas; (i) sem regressão em layout responsivo, legenda, eixos, ReferenceLines ou barras de volume.

