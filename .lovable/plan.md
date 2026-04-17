
#9 entregue. Próximo: #10 — Heatmap de horário ótimo de contato (quando o contato responde mais).

Já existem `ContactTimeHeatmap` e `useContactTimeAnalysis` no projeto, então não recriar. O gap real é **agregação global** (todos contatos do usuário) para responder "quando devo prospectar?", não individual.

## Melhoria #10: Best Time to Engage — Heatmap Global do Vendedor

### Escopo
Card no Dashboard mostrando heatmap 7×17 (dom-sab × 6h-22h) de **taxa de resposta** das interações outbound do vendedor logado nos últimos 90 dias, destacando os 3 melhores slots com badges acionáveis.

### Dados (client-side, sem nova edge function)
- Query `interactions` do user: `direction='outbound'`, últimos 90d, com flag de resposta (existe interação inbound do mesmo `contact_id` em até 48h após)
- Agregação por `(day_of_week, hour_of_day)`: total enviado, total respondido, response_rate
- Top 3 slots com mín. 5 tentativas para evitar ruído

### UI
- `BestTimeHeatmapCard.tsx` em `src/components/dashboard/`
- Grid 7×17 com gradiente verde (alta taxa) → vermelho (baixa), opacity por volume
- Header: badges "Melhor: Ter 10h (78%)", "2º: Qua 14h (72%)", "3º: Qui 9h (69%)"
- Legenda + tooltip nativo `title` por célula
- Empty state: "Mín. 20 interações outbound nos últimos 90d"

### Hook
- `useBestTimeHeatmap()` — useQuery, staleTime 10min, retorna `{ cells, topSlots, totalAttempts }`

### Integração
- Adicionar no Dashboard (`Index.tsx`) na seção de inteligência ou nova aba "Timing"

### Arquivos
- Novo: `src/hooks/useBestTimeHeatmap.ts`
- Novo: `src/components/dashboard/BestTimeHeatmapCard.tsx`
- Editar: `src/pages/Index.tsx` (montar card)
- Nova memória: `mem://features/best-time-heatmap-global.md`

### Validação E2E
- Build limpo
- User com 20+ outbound + responses → heatmap colorido + top 3
- User sem dados → empty state
- Tooltip mostra "Ter 10h: 78% (39/50 respondidas)"

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR.

Após #10 → #11 (next-best-action por contato — sugestão IA do próximo passo baseado em score, sentiment trend, dias sem interação).
