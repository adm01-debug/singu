
# Plano: Enriquecer a Tendência Semanal de Sentimento

## Status atual

A aba Insights de `/interacoes` **já possui** um `SentimentTrendChart` semanal funcional, plugado em `useInteractionsInsights.sentimentTrend` (agrupamento por semana ISO) e respondendo ao switcher 7d/30d/90d. Renderiza 3 linhas (Positivo / Neutro / Negativo) sobre o período.

**Lacunas reais:**
1. A linha de **Misto** existe nos dados mas não é plotada
2. Não há **resumo de evolução** (delta vs período anterior, melhor/pior semana)
3. Não há **linha de tendência** (média móvel ou %positivo agregado) para leitura rápida do rumo
4. Sem indicação visual de **volume** semanal (uma semana com 2 conversas pesa igual a uma com 50)
5. Eixo Y mostra contagem absoluta — dificulta comparar semanas com volumes muito diferentes

Esta entrega transforma o chart em um verdadeiro "rastreador de evolução" sem novas queries.

## Reutilização

- `useInteractionsInsights` → `sentimentTrend` (já existe, já pondera por semana ISO)
- `SentimentTrendChart` (refatorar in-place, sem novo componente)
- `CHART_COLORS` em `nlpAnalyticsConstants` (já tem positive/neutral/negative — adicionar `mixed`)
- `Recharts` (LineChart, ComposedChart, Bar, ReferenceLine) — já no bundle
- Padrão de `Badge` + `TrendingUp/Down/Minus` do `SentimentTrendChart` de `contact-detail` (referência visual)

Sem novo hook, sem nova RPC, sem nova edge function, sem novo fetch.

## Arquitetura

```text
InsightsPanel
 └─ Card "Tendência semanal" (existente)
     └─ SentimentTrendChart (refatorado)
         ├─ Header inline: badge de evolução (% positivo: ↑ X / → / ↓ X vs metade anterior)
         ├─ Mini-stats: melhor semana | pior semana | total no período
         └─ ComposedChart (h-64)
             ├─ Bar (volume total por semana, eixo Y direito, opacity 30%)
             ├─ Line Positivo / Neutro / Negativo / Misto (eixo Y esquerdo, count)
             ├─ Line "% Positivo" tracejada (eixo Y direito secundário, 0-100)
             └─ ReferenceLine no índice da melhor semana (verde) e pior semana (vermelha)
```

## Implementação

### 1. `useInteractionsInsights.ts` — enriquecer cada ponto e expor sumário

Atualmente `sentimentTrend: { week, positive, neutral, negative, mixed, total }[]`.

Adicionar derivações no mesmo `useMemo`:

```ts
// Por ponto: % positivo (positive / total * 100), arredondado
sentimentTrend: Array<{
  week: string;
  positive: number; neutral: number; negative: number; mixed: number;
  total: number;
  positivePct: number; // novo
}>

// Resumo agregado do período
sentimentTrendSummary: {
  bestWeek: { week: string; positivePct: number } | null;
  worstWeek: { week: string; positivePct: number } | null;
  deltaPct: number;          // %positivo da 2ª metade − 1ª metade
  direction: "up" | "stable" | "down"; // limiares ±5pp
  totalInteractions: number;
}
```

Cálculos puros, O(n), zero overhead. Quando `sentimentTrend.length < 2`, summary retorna `direction: "stable"` e weeks `null`.

### 2. `SentimentTrendChart.tsx` — refatorar (≤140 linhas)

- Trocar `LineChart` por `ComposedChart`
- Adicionar `<Bar dataKey="total" yAxisId="vol" fill="hsl(var(--muted))" opacity={0.25} />`
- Manter as 3 linhas existentes + adicionar `<Line dataKey="mixed" stroke="hsl(var(--warning))" />`
- Adicionar `<Line dataKey="positivePct" yAxisId="pct" strokeDasharray="4 4" stroke="hsl(var(--primary))" />` para leitura de tendência
- Dois `<YAxis>`: esquerdo `id="count"` (decimais não), direito `id="pct"` domain `[0, 100]` formato `%`
- `ReferenceLine` vertical em `bestWeek` (success) e `worstWeek` (destructive) quando ambos diferentes
- Header acima do chart: `Badge` com ícone `TrendingUp/Minus/TrendingDown` + texto "Melhorando +Xpp / Estável / Piorando −Xpp" colorido por `direction`
- Mini-stats (3 cards inline `text-xs`): "Melhor: dd/mm — X%" · "Pior: dd/mm — X%" · "Total: N conversas"
- Fallback: se `< 2` semanas, mostra mensagem "Dados insuficientes para tendência"
- `React.memo` mantido

### 3. `nlpAnalyticsConstants.ts` — adicionar cor para `mixed`

```ts
CHART_COLORS = { positive, neutral, negative, mixed: 'hsl(38, 92%, 50%)' }
```

### 4. `InsightsPanel.tsx` — passar summary

- Desestruturar `sentimentTrendSummary` do hook
- Passar como prop ao `SentimentTrendChart`

### 5. Edge cases

- 0 ou 1 semana: chart oculto, exibe "Dados insuficientes para tendência"
- 2 semanas: badge mostra delta, sem ReferenceLine de melhor/pior se idênticas
- Total = 0 numa semana: `positivePct = 0`, sem divisão por zero
- Cores semânticas: `success`/`warning`/`destructive`/`muted-foreground` via tokens HSL

### 6. Padrões obrigatórios

- PT-BR
- Sem `any`, sem `dangerouslySetInnerHTML`
- `Array.isArray` defensivo
- Tokens semânticos
- Flat (sem shadow)
- Zero novas queries

## Arquivos tocados

**Editados (3):**
- `src/hooks/useInteractionsInsights.ts` — `positivePct` por ponto + `sentimentTrendSummary`
- `src/components/interactions/insights/SentimentTrendChart.tsx` — ComposedChart + barras de volume + linha %positivo + ReferenceLines + header com delta
- `src/components/interactions/insights/InsightsPanel.tsx` — passar `summary` ao chart
- `src/data/nlpAnalyticsConstants.ts` — cor para `mixed`

## Critério de fechamento

(a) Chart de tendência mostra 4 linhas (positivo, neutro, negativo, misto) + barras de volume semanal ao fundo + linha tracejada `% positivo` no eixo direito, (b) header do card exibe badge "Melhorando/Estável/Piorando ±Xpp" comparando 2ª metade vs 1ª metade do período, (c) mini-stats abaixo mostram melhor semana, pior semana e total de conversas, (d) ReferenceLines verticais marcam visualmente best/worst week, (e) fallback "Dados insuficientes" quando <2 semanas, (f) zero novas queries de rede, (g) zero regressão em distribuição, temas, objeções, KPIs ou drawers.
