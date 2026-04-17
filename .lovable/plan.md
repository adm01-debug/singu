
Conversation Intelligence acabou. Próximo grande gap = **Forecasting & Revenue Intelligence** — previsão de receita com IA, weighted pipeline avançado, deal health scoring e detecção de risco. Hoje pipeline_kanban tem só weighted forecast simples; falta forecast por período (mês/trimestre), categorização (commit/best case/pipeline), confidence score por deal, alertas de slip e snapshots históricos para tracking de accuracy.

## Plano: Forecasting & Revenue Intelligence

### 1. Schema (migration)
- `forecast_periods` — `id, user_id, period_type ('month'|'quarter'), period_start, period_end, quota_amount, status ('open'|'closed'), closed_at`
- `deal_forecasts` — `id, user_id, deal_id, period_id, category ('commit'|'best_case'|'pipeline'|'omitted'), confidence_score int (0-100), forecasted_amount, forecasted_close_date, risk_factors jsonb, health_score int, last_activity_at, slip_count int, notes`. Unique(deal_id, period_id)
- `forecast_snapshots` — snapshot semanal/diário: `id, user_id, period_id, snapshot_date, commit_total, best_case_total, pipeline_total, weighted_total, deal_count, snapshot_data jsonb`
- `forecast_categories_history` — log de mudanças de categoria: `id, deal_forecast_id, from_category, to_category, changed_at, reason`
- RLS por user_id, audit em deal_forecasts. RPC `seed_forecast_period(_user_id, _type)` cria período atual

### 2. Edge Functions
- **`forecast-analyzer`**: para cada deal aberto no período → calcula health_score (atividade recente, stage age, talk ratio se houver, score do contato) → invoca IA Lovable (gemini-3-flash-preview) com tool calling para sugerir categoria (commit/best/pipeline) + confidence + risk_factors → upsert em deal_forecasts. Rate limit
- **`forecast-snapshot-cron`**: diário, captura snapshot do estado atual de todos os períodos abertos para tracking histórico de accuracy
- **`forecast-narrative`**: gera narrativa executiva do forecast atual (commit vs quota, top deals em risco, recomendações)

### 3. Hooks `src/hooks/useForecasting.ts`
- `useForecastPeriods`, `useCurrentPeriod`, `useCreatePeriod`, `useClosePeriod`
- `useDealForecasts(periodId)`, `useUpdateDealForecast` (mudar categoria manualmente), `useAnalyzeForecast`
- `useForecastSnapshots(periodId)` — gráfico de evolução
- `useForecastSummary(periodId)` — totais por categoria, attainment %, gap to quota
- `useForecastNarrative`

### 4. UI

**`/forecasting`** (hub):
- 4 KPIs: Commit, Best Case, Quota Attainment %, Gap to Quota
- Seletor de período (mês/trimestre atual + anteriores)
- Visão "Waterfall": commit → best case → pipeline → quota line
- Tabs:
  - "Pipeline por categoria" — colunas drag-and-drop (commit/best/pipeline/omitted) com deals
  - "Trending" — line chart de snapshots ao longo do período
  - "Risk" — tabela de deals em risco (low health_score, no activity, slipped)
  - "Accuracy" — comparação forecast vs actual de períodos fechados

**`/forecasting/setup`**: editor de quota por período + configuração de pesos de health score

**Widget `DealForecastBadge`**: usado em PipelineKanban card mostrando categoria + confidence

**Componentes** em `src/components/forecasting/`:
- `ForecastWaterfall` (recharts), `CategoryColumn` (drag-drop kanban), `HealthScoreIndicator`
- `RiskDealsTable`, `AccuracyChart`, `QuotaProgressBar`, `ForecastNarrativeCard`
- `PeriodSelector`, `CategoryBadge`, `AnalyzeForecastButton`

### 5. Integração
- `PipelineKanban`: cada deal card mostra `DealForecastBadge` quando há forecast no período aberto; click move categoria
- Win/Loss: ao fechar deal, atualiza `forecast_periods.actual_won_amount` para tracking de accuracy
- Lead Scoring: contatos primários do deal entram no health_score do forecast

### 6. Navegação
- Sidebar: "Forecasting" (ícone TrendingUp ou DollarSign — escolher LineChart pra diferenciar de Win/Loss) abaixo de Conversation Intel
- Rotas `/forecasting` e `/forecasting/setup` em App.tsx

### 7. Memória
- `mem://features/forecasting-revenue-intelligence` + atualizar índice

### Não fazer
- Não criar tabelas products/proposals
- Não substituir weighted forecast simples do pipeline_kanban — coexiste
- Não implementar ML model próprio — usa IA via Lovable Gateway
- Sem multi-currency neste passo
