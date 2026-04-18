
#17 entregue. Próxima: #18 — Channel Performance Matrix.

## Melhoria #18: Channel Performance Matrix

### Escopo
Matriz visual cruzando **canal × estágio do funil** mostrando qual canal converte melhor em cada etapa, com taxas de conversão, tempo médio de avanço e recomendação por estágio. Responde "qual canal usar para mover deal de Qualificação→Proposta?".

### Diferencial vs heatmaps existentes
- Heatmaps de timing: respondem **quando**
- Channel Matrix: responde **qual canal** + **em que estágio**

### Arquitetura (100% client-side)
**Hook** `useChannelPerformanceMatrix()`:
- Query `interactions` últimos 180d + `deals` (via external-data) com transições de stage
- Cruza canal (whatsapp/email/call/meeting) × estágio quando interação ocorreu
- Calcula: total interações, taxa avanço (interação→próximo stage em 14d), tempo médio até avanço
- Identifica célula vencedora por estágio (highest conversion)
- StaleTime 15min, gcTime 30min

**Componente** `ChannelPerformanceMatrixCard.tsx` (Dashboard→Inteligência):
- Header com título + período (180d)
- Grid 4 canais × N estágios (linhas × colunas)
- Cada célula: ícone canal + taxa% + mini stats (total / dias avg)
- Célula vencedora por estágio: ring primary + badge "🏆 Top"
- Tooltip detalhado por célula
- Insight textual: "Para mover deals de {stage X} para {stage Y}, use {canal}"
- Empty state se <30 interações totais

### Arquivos
- Novo: `src/hooks/useChannelPerformanceMatrix.ts` (~180 linhas)
- Novo: `src/components/dashboard/ChannelPerformanceMatrixCard.tsx` (~250 linhas)
- Editar: `src/components/dashboard/tabs/IntelligenceTab.tsx` (adicionar nova seção "Performance por Canal")
- Nova memória: `mem://features/channel-performance-matrix.md`
- Atualizar: `mem://index.md`

### Validação E2E
- Build limpo (sem `any`, ≤400 linhas/arquivo)
- Matriz renderiza com dados reais
- Célula vencedora destacada por estágio
- Tooltips funcionam
- Empty state em conta nova
- Insight textual coerente

### Restrições
PT-BR, TanStack Query (sem useEffect), 100% client-side, sem migration, sem nova edge function.

Após #18 → #19 (touchpoint sequence analysis — sequências de canais que mais convertem).
