
#18 entregue. Próxima: #19 — Touchpoint Sequence Analysis.

## Melhoria #19: Touchpoint Sequence Analysis

### Escopo
Analisar **sequências de canais** que mais convertem deals. Responde: "qual ordem de toques (ex: Email→WhatsApp→Call) tem maior taxa de fechamento?". Diferente da matriz canal×estágio (#18), foco aqui é a **ordem temporal** dos toques.

### Diferencial
- #16 BestTime: quando contatar
- #17 Inbound: quando eles me procuram
- #18 Channel Matrix: qual canal por estágio
- **#19 Sequence: qual ORDEM de canais converte mais**

### Arquitetura (100% client-side)
**Hook** `useTouchpointSequences()`:
- Query `interactions` 180d + `deals` (external) com status `won/lost`
- Agrupa interações por `contact_id`, ordena cronologicamente
- Extrai sequência canônica de até 5 primeiros toques únicos por deal (ex: `email→whatsapp→call`)
- Agrega: para cada sequência → total deals, won, lost, taxa %, ticket médio
- Identifica top 5 sequências vencedoras (mín 3 deals)
- StaleTime 15min

**Componente** `TouchpointSequenceCard.tsx` (Dashboard→Inteligência):
- Header com título + filtro de tamanho (2/3/4/5 toques)
- Lista ranqueada: cada linha mostra ícones canais em sequência (com setas), taxa %, badge "🏆 Top" no #1, total deals
- Insight: "Sequência campeã: {seq} — {rate}% de conversão"
- Empty state se <10 deals fechados

### Arquivos
- Novo: `src/hooks/useTouchpointSequences.ts` (~180 linhas)
- Novo: `src/components/dashboard/TouchpointSequenceCard.tsx` (~220 linhas)
- Editar: `src/components/dashboard/tabs/IntelligenceTab.tsx` (adicionar abaixo do ChannelMatrix)
- Nova memória: `mem://features/touchpoint-sequence-analysis.md`
- Atualizar: `mem://index.md`

### Validação E2E
- Build limpo, ≤400 linhas/arquivo, sem `any`
- Sequências renderizadas com ícones + setas
- Filtro de tamanho funciona
- Top sequência destacada
- Empty state em conta nova
- Insight coerente

### Restrições
PT-BR, TanStack Query, sem migration, sem edge function nova.

Após #19 → #20 (deal velocity benchmark — comparar tempo médio do funil vs benchmarks).
