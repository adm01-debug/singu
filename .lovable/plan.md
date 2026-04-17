
#8 entregue. Próximo: #9 — Sentiment Trend Chart por contato (agregação de sentimentos das interações ao longo do tempo).

## Melhoria #9: Sentiment Trend Chart por contato

### Escopo
Gráfico de linha/área no `ContatoDetalhe` mostrando evolução do sentimento das interações dos últimos 90 dias, com média móvel e detecção de tendência (melhorando/estável/piorando).

### Dados
- Query em `interactions` filtrando por `contact_id`, `sentiment IS NOT NULL`, últimos 90 dias
- Mapeamento: `positivo=+1`, `neutro=0`, `negativo=-1`
- Agrupamento por semana (ISO week) com média
- Média móvel de 3 semanas para suavizar
- Cálculo de tendência: regressão linear simples sobre últimos 6 pontos → slope >0.05 = melhorando, <-0.05 = piorando, senão estável

### UI
- Componente `SentimentTrendChart.tsx` em `src/components/contact-detail/`
- Recharts `AreaChart` com gradient (verde→vermelho conforme valor)
- Header: badge de tendência com ícone (TrendingUp/Minus/TrendingDown) + cor semântica
- Stat cards compactos: total de interações analisadas, sentimento médio, % positivos
- Empty state: "Sem dados de sentimento suficientes (mín. 3 interações)"

### Hook
- `useContactSentimentTrend(contactId)` — useQuery, staleTime 5min, retorna `{ points, trend, stats }`
- Agregação 100% client-side (sem edge function — dados já existem)

### Integração
- `ContatoDetalhe.tsx`: aba "Inteligência" (ou nova aba "Sentimento") ganha o chart no topo
- Se não houver aba adequada, adicionar dentro da aba "interacoes" abaixo do `ContactEmailThreadsSection`

### Arquivos
- Novo: `src/hooks/useContactSentimentTrend.ts`
- Novo: `src/components/contact-detail/SentimentTrendChart.tsx`
- Editar: `src/pages/ContatoDetalhe.tsx` (montar chart na aba apropriada)
- Nova memória: `mem://features/sentiment-trend-chart.md`

### Validação E2E
- Build limpo
- Contato com 3+ interações de sentiment → chart renderiza com pontos semanais
- Tendência calculada e badge mostrado
- Contato sem dados → empty state amigável
- Tooltip mostra sentiment médio + nº de interações da semana

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR. Reusar Recharts já presente.

Após #9 → #10 (heatmap de horário ótimo de contato — quando o contato responde mais).
