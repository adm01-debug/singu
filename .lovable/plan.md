

# Plano: Switch para alternar visibilidade da linha % positivo

## Diagnóstico

- O `SentimentTrendChart.tsx` exibe simultaneamente as barras de contagem (Positivo, Neutro, Negativo, Misto) e a linha de `% positivo` (com MA), o que pode poluir a leitura quando o foco é volume absoluto.
- Falta um controle para isolar a leitura: ou o usuário foca em **distribuição de volume** (barras), ou em **tendência relativa** (linha %).

## O que será construído

Toda a mudança em `src/components/interactions/insights/SentimentTrendChart.tsx`. Sem novos hooks/dependências.

### 1. Novo state local `showPositivePctLine`

- `useState<boolean>(true)` — default mostra a linha (preserva comportamento atual).
- Persistência em `localStorage` chave `singu:sentiment-trend:show-pct-line` (lazy init + setter sincronizado), padrão consistente com outras prefs do projeto.

### 2. Switch no header do card

Junto aos demais controles do header (seletor de período / direção):
- `<Switch>` shadcn + `<Label>` "Linha % positivo" (text-xs, gap-2).
- `aria-label="Alternar linha de % positivo"`.
- Posicionado de forma compacta, sem quebrar layout responsivo (flex-wrap se necessário).

### 3. Renderização condicional

- Linha `<Line dataKey="positivePct" />` (e MA `positivePctMA` se existir como série separada) só renderiza quando `showPositivePctLine === true`.
- Quando oculta:
  - Eixo Y direito (% positivo) também é ocultado (`yAxisId="right"` removido condicionalmente) para o gráfico não ficar com escala vazia.
  - `ReferenceLine` ligadas ao eixo direito (se houver, ex.: 50%) também ocultas.
  - Tooltip continua mostrando contagens das barras (incluindo Misto) e omite a linha % naturalmente, pois a série não está renderizada.
  - Legenda do Recharts atualiza automaticamente.

### 4. Sem alterações em

- Hooks de fetch/agregação (`useInteractionsInsights`), MA, `sortedData`, `evolutionStats`, `confidenceInfo`, anotações, stat cards, badge de direção, seletor de período, mascaramento de IP, ordenação cronológica.
- Barras de contagem (Positivo/Neutro/Negativo/Misto) permanecem sempre visíveis — o switch afeta exclusivamente a linha % e o eixo direito.

## Critérios de aceite

(a) Novo state `showPositivePctLine` com default `true` e persistência em `localStorage` (`singu:sentiment-trend:show-pct-line`); (b) `<Switch>` + `<Label>` "Linha % positivo" no header do card, com `aria-label` e layout responsivo (flex-wrap); (c) quando `false`, a linha de `% positivo` e sua MA são removidas do `<ComposedChart>`, junto com o eixo Y direito e quaisquer `ReferenceLine` desse eixo; (d) barras de contagem (incluindo Misto) e tooltip permanecem 100% funcionais em ambos os estados; (e) sem mudanças em hooks de fetch, agregação, MA, anotações, stat cards, evolução, confiança ou demais funcionalidades; (f) sem novas dependências, PT-BR, flat, sem `any`, sem `dangerouslySetInnerHTML`; (g) arquivo permanece ≤350 linhas; (h) sem regressão em layout responsivo, legenda, badge de direção ou seletor de período.

