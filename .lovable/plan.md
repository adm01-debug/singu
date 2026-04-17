
#11 entregue. Próximo: #12 — Deal Slip Risk (alerta IA quando deals começam a "esfriar").

## Melhoria #12: Deal Slip Risk Detector

### Escopo
Sistema que detecta deals em risco de "esfriar" (slip) baseado em sinais combinados: dias parados no stage, queda de sentiment, ausência de interações recentes, idade vs benchmark do stage. Mostra badge de risco no card do Pipeline + drawer com explicação detalhada e ações sugeridas.

### Cálculo de risco (client-side, sem edge function)
Score 0-100 ponderado:
- **Stagnation (40%)**: dias parados no stage atual / benchmark esperado por stage
- **Sentiment decay (25%)**: tendência negativa nas últimas 5 interações
- **Engagement gap (25%)**: dias sem interação inbound do contato
- **Age vs benchmark (10%)**: idade total do deal vs ciclo médio

Classificação: 0-30 saudável (verde), 31-60 atenção (amarelo), 61-100 risco alto (vermelho).

Benchmarks por stage hardcoded (lead=7d, qualified=14d, proposal=10d, negotiation=21d, etc.).

### Hook
- `useDealSlipRisk(deal)` — calcula localmente baseado em deal + interações + stage; retorna `{ score, level, factors[], recommendations[] }`
- `useDealsAtRisk()` — agrega todos os deals abertos do user, retorna ordenados por risco

### UI
- **`DealRiskBadge.tsx`**: badge compacto (verde/amarelo/vermelho) com tooltip mostrando score
- **`DealRiskDrawer.tsx`**: drawer com breakdown dos 4 fatores (progress bars), recomendações textuais, botão "Gerar plano de recuperação IA" (opcional, futuro)
- **`DealsAtRiskCard.tsx`**: card no Dashboard listando top 5 deals em risco com link direto

### Integração
- `Pipeline.tsx`: badge no canto superior direito de cada `DealCard` (Kanban)
- `IntelligenceTab.tsx` do Dashboard: card `DealsAtRiskCard`
- Click no badge → abre drawer

### Arquivos
- Novo: `src/hooks/useDealSlipRisk.ts`
- Novo: `src/hooks/useDealsAtRisk.ts`
- Novo: `src/components/pipeline/DealRiskBadge.tsx`
- Novo: `src/components/pipeline/DealRiskDrawer.tsx`
- Novo: `src/components/dashboard/DealsAtRiskCard.tsx`
- Editar: card do deal no Pipeline (localizar componente exato)
- Editar: `src/components/dashboard/tabs/IntelligenceTab.tsx`
- Nova memória: `mem://features/deal-slip-risk.md`

### Validação E2E
- Build limpo
- Deal parado >benchmark → badge vermelho
- Deal recente saudável → badge verde
- Drawer mostra 4 fatores com progress bars
- Card no Dashboard lista top 5 em risco

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR, 100% client-side (sem nova edge function nem migration).

Após #12 → #13 (forecast confidence — IA que avalia probabilidade de fechamento por deal combinando stage, slip risk, momentum).
