
## Melhoria #17: Mapa de Calor — Quando seus Clientes Interagem com Você

### Contexto
Já existem 3 heatmaps no projeto:
1. `BestTimeHeatmapCard` (Dashboard→Inteligência) — outbound→resposta em 48h
2. `ActivityHeatmapChart` — volume bruto de interações
3. `TimeHeatmapCard` (ContatoDetalhe) — sucesso por contato

**Falta:** um heatmap focado em **quando os clientes (eles) iniciam contato com você** — ou seja, sinais de **intenção inbound**. Isso responde "quando devo estar disponível?" em vez de "quando devo prospectar?".

### Escopo
Novo card `InboundActivityHeatmapCard` no Dashboard→Inteligência (ao lado do BestTime existente) com:
- Grid 7×17 (Dom-Sáb × 6h-22h) de **interações inbound** (`initiated_by='them'`) últimos 90d
- Cores por **volume relativo** (gradiente primary), não taxa
- Top 3 janelas de pico com badge "🔥 Pico"
- Stat cards: total inbound, horário mais ativo, dia mais ativo
- Insight textual: "Seus clientes mais te procuram nas {dia} às {hora}"
- Toggle de canal (Todos / WhatsApp / Email / Call) para segmentar
- Empty state se <10 inbounds nos últimos 90d

### Diferencial vs heatmaps existentes
| Heatmap | Foco | Métrica |
|---|---|---|
| BestTime (existente) | Outbound→Resposta | Taxa % |
| Activity (existente) | Volume total | Contagem absoluta |
| **Inbound (novo)** | **Quando clientes me procuram** | **Volume inbound + canal** |

### Arquitetura (100% client-side)
- **Hook novo** `useInboundActivityHeatmap(channel?)`:
  - Query `interactions` últimos 90d, `initiated_by='them'`, `user_id` atual
  - Filtro opcional por `tipo` (whatsapp/email/call)
  - Agrega em grid 7×17, identifica top 3 picos, calcula totais
  - StaleTime 10min, gcTime 30min
- **Componente** `InboundActivityHeatmapCard.tsx`:
  - Header com título + ToggleGroup de canal
  - Stat cards (3 mini-cards: total, dia top, hora top)
  - Heatmap grid com tooltips nativos (`title`)
  - Insight textual abaixo
  - Legenda de intensidade
  - Empty state com CTA "Capture mais interações"

### Arquivos
- Novo: `src/hooks/useInboundActivityHeatmap.ts` (~120 linhas)
- Novo: `src/components/dashboard/InboundActivityHeatmapCard.tsx` (~220 linhas)
- Editar: `src/components/dashboard/IntelligenceTab.tsx` (adicionar card abaixo/ao lado do BestTime)
- Nova memória: `mem://features/inbound-activity-heatmap.md`
- Atualizar: `mem://index.md`

### Validação E2E
- Build limpo (sem `any`, ≤400 linhas/arquivo)
- Card renderiza com dados reais
- Toggle de canal filtra corretamente
- Top 3 picos destacados com badge
- Empty state em conta nova
- Tooltips funcionam ao hover
- Insight textual coerente com dados

### Restrições
PT-BR, sem `useEffect` para fetch (TanStack Query), sem edge function nova, sem migration.

Após #17 → #18 (channel performance matrix — qual canal converte mais por persona/stage).
