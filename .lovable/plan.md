
# Plano: Insights automáticos de sentimento e temas em /interacoes

## Objetivo

Adicionar uma 3ª aba **"Insights"** em `/interacoes` que agrega análise IA já existente das interações com transcrição/conteúdo, mostrando: distribuição de sentimento, principais temas/tópicos detectados, objeções recorrentes e exemplos clicáveis por categoria.

## Reutilização (zero retrabalho)

O projeto **já tem** toda a infra de análise:
- Tabela `conversation_analyses` (sentiment_overall, sentiment_timeline, topics, objections, key_moments, coaching_score)
- Edge function `conversation-analyzer` com Lovable AI (Gemini)
- Hook `useConversationAnalyses({sentiment, minScore, days})` retorna lista filtrada
- Pipeline automático dispara para interações >100 chars (memory `automated-analysis-pipeline`)
- `interactions.sentiment` enum também disponível como fallback rápido

A nova aba **agrega e visualiza** esses dados — não cria nova análise nem novo schema.

## Arquitetura

```text
/interacoes?tab=insights
 ├─ Filtro de período: 7d | 30d | 90d (default 30d)
 │
 ├─ Linha 1 — KPIs (4 cards compactos):
 │   • Interações analisadas
 │   • Sentimento dominante (pos/neu/neg %)
 │   • Coaching score médio
 │   • Objeções não tratadas
 │
 ├─ Linha 2 — 2 colunas:
 │   ├─ Distribuição de Sentimento (donut + legenda %)
 │   └─ Tendência de Sentimento (line chart por semana)
 │
 ├─ Linha 3 — Temas detectados:
 │   • Lista ranqueada (top 10) com count + sparkline mini
 │   • Click em tema → drawer lateral com 5 exemplos
 │     (interação + trecho + sentimento + link p/ Ficha 360)
 │
 ├─ Linha 4 — Objeções mais frequentes:
 │   • Cards com objeção + count + % handled vs unhandled
 │   • Sugestão de resposta (campo já existente)
 │
 └─ Empty state IA-aware:
     "Análises são geradas automaticamente para interações
      com transcrição. Registre uma chamada/reunião com conteúdo
      para começar." + botão "Registrar Interação"
```

## Implementação

### 1. Hook agregador `useInteractionsInsights`
`src/hooks/useInteractionsInsights.ts`
- Composição sobre `useConversationAnalyses({days})` (já existe)
- Calcula via `useMemo` client-side:
  - `sentimentDistribution` — count + % por positive/neutral/negative
  - `sentimentTrend` — agrupado por semana ISO
  - `topThemes` — flat dos `topics[]`, agrupa por `label`, conta `mentions`, retorna top 10 + exemplos (interaction_ids)
  - `topObjections` — flat dos `objections[]`, agrupa por `objection_text` normalizado, % handled
  - `kpis` — totalAnalyzed, dominantSentiment, avgCoachingScore, unhandledObjections
- StaleTime 5min, sem `useEffect`

### 2. Componente principal `InsightsPanel`
`src/components/interactions/insights/InsightsPanel.tsx` (≤200 linhas)
- Header com select de período (`Tabs` 7d/30d/90d, persistência URL `?periodo=`)
- 4 KPI cards (reutiliza padrão `StatCard` se existir, senão Card+Badge)
- Grid 2 colunas com 2 charts
- Lista de temas + lista de objeções
- Skeleton loading + EmptyState

### 3. Subcomponentes (≤120 linhas cada)
- `SentimentDistributionChart.tsx` — donut Recharts (cores `CHART_COLORS` de `nlpAnalyticsConstants`)
- `SentimentTrendChart.tsx` — line chart por semana
- `ThemesRanking.tsx` — lista ranqueada com badge count, click abre drawer
- `ObjectionsRanking.tsx` — cards com handled/unhandled bar
- `ThemeExamplesDrawer.tsx` — Sheet lateral com 5 exemplos clicáveis

### 4. Integração em `Interacoes.tsx`
- Adicionar 3ª `TabsTrigger value="insights"` ao lado de Lista/Timeline
- Renderiza `<InsightsPanel />` lazy quando ativo
- Persistência via `?tab=insights` (já existe padrão)

### 5. Padrões obrigatórios
- PT-BR
- `Array.isArray()` antes de iterar
- Sem `any`, sem `dangerouslySetInnerHTML`
- Tokens semânticos (Nexus Blue, success/warning/destructive)
- Flat design — sem sombras/gradientes
- `React.memo` em charts e listas
- Tratamento gracioso quando `conversation_analyses` vazio (empty state explicativo)

## Arquivos tocados

**Novos (7):**
- `src/hooks/useInteractionsInsights.ts`
- `src/components/interactions/insights/InsightsPanel.tsx`
- `src/components/interactions/insights/SentimentDistributionChart.tsx`
- `src/components/interactions/insights/SentimentTrendChart.tsx`
- `src/components/interactions/insights/ThemesRanking.tsx`
- `src/components/interactions/insights/ObjectionsRanking.tsx`
- `src/components/interactions/insights/ThemeExamplesDrawer.tsx`

**Editados (1):**
- `src/pages/Interacoes.tsx` — adicionar 3ª aba "Insights"

## Critério de fechamento

(a) Aba `/interacoes?tab=insights` renderiza em <2s, (b) 4 KPIs + 2 charts + ranking de temas + ranking de objeções populados a partir de `conversation_analyses` reais, (c) drawer de exemplos por tema funcional com link p/ Ficha 360, (d) filtro de período 7/30/90d persistido na URL, (e) empty state explicativo quando não há análises, (f) zero regressão nas abas Lista e Timeline.
