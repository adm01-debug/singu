
#12 entregue. Próximo: #13 — Forecast Confidence por deal.

## Melhoria #13: Forecast Confidence Score

### Escopo
Score 0-100 de confiança de fechamento por deal combinando: probabilidade do stage, slip risk invertido, momentum (interações últimos 14d vs 14d anteriores), idade vs ciclo médio, valor relativo. Exibe como badge no DealCard + coluna de forecast ponderado refinado no Pipeline.

### Cálculo (client-side, sem edge function)
Confidence 0-100 ponderado:
- **Stage probability (35%)**: probabilidade base do stage (lead=10%, qualif=25%, proposta=50%, negoc=70%, fechamento=90%)
- **Slip risk invertido (30%)**: `100 - slipScore` (reusa `useDealSlipRisk`)
- **Momentum (20%)**: razão (interações 14d recentes / 14d anteriores), normalizado 0-100
- **Velocity fit (15%)**: deal dentro do ciclo médio (60d) → alto, acima → baixo

Classificação: 0-40 baixa, 41-70 média, 71-100 alta.

### Hook
- `useDealForecastConfidence(deal)` — combina slip risk + momentum + stage; retorna `{ confidence, level, expectedCloseValue, factors[] }`
- `expectedCloseValue = deal.valor * (confidence/100)`

### UI
- **`DealConfidenceBadge.tsx`**: badge compacto (cinza/azul/verde) ao lado do valor no DealCard
- **`ForecastConfidencePanel.tsx`**: painel no Pipeline mostrando soma de `expectedCloseValue` agregada por nível (Alta/Média/Baixa) com barras horizontais

### Integração
- `Pipeline.tsx`: adicionar badge no DealCard (próximo ao DealRiskBadge) + painel no header acima das colunas

### Arquivos
- Novo: `src/hooks/useDealForecastConfidence.ts`
- Novo: `src/components/pipeline/DealConfidenceBadge.tsx`
- Novo: `src/components/pipeline/ForecastConfidencePanel.tsx`
- Editar: `src/pages/Pipeline.tsx` (DealCard + header)
- Nova memória: `mem://features/forecast-confidence.md`

### Validação E2E
- Build limpo
- Deal em negociação saudável → confidence alta (verde)
- Deal estagnado → confidence baixa (cinza)
- Painel agrega valores por nível corretamente

### Restrições
≤400 linhas/arquivo, sem `any`, sem `useEffect` para fetch, PT-BR, 100% client-side.

Após #13 → #14 (win/loss analysis — IA agrega motivos de deals ganhos/perdidos e sugere padrões).
