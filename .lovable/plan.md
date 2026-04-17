
Marketing Suite finalizado. Próxima entrega = **Revenue Operations Dashboard (RevOps)** — Parte B do plano anterior. Visão unificada da máquina de receita ponta-a-ponta.

## Plano: RevOps Dashboard

### 1. Schema (migration)
- `revops_snapshots` — id, user_id, period (date), funnel_stage ('visitor'|'lead'|'mql'|'sql'|'opportunity'|'customer'), count int, conversion_rate numeric, avg_velocity_days numeric, total_value numeric, captured_at
- `revops_benchmarks` — id, user_id, metric_key (text), target_value numeric, warning_threshold numeric, critical_threshold numeric, updated_at
- `revops_alerts` — id, user_id, metric_key, severity ('info'|'warning'|'critical'), message, current_value, expected_value, period, dismissed bool, created_at
- RLS por user_id; índices em (user_id, period), (user_id, metric_key)
- RPC `compute_revops_kpis(_user_id, _period_start, _period_end)` retorna jsonb com win_rate, cycle_time, pipeline_coverage, mql_to_sql_rate, sql_to_won_rate
- RPC `dismiss_revops_alert(_alert_id)`

### 2. Edge Function
- `revops-snapshot-builder` (cron diário 04:00 UTC):
  - Para cada user_id ativo: consolida MQL classifications, SQL handoffs, deals (opportunities + won) do dia
  - Calcula conversion rates entre estágios e velocity médio
  - Insere snapshot do dia em `revops_snapshots`
  - Compara com período anterior (7d/30d) → gera alertas se queda > threshold
  - Insere em `revops_alerts`

### 3. Hooks (`src/hooks/`)
- `useRevOpsSnapshots(period)` — lista snapshots filtrados
- `useRevOpsKPIs(periodStart, periodEnd)` — chama RPC compute
- `useRevOpsBenchmarks` + `useUpsertBenchmark`
- `useRevOpsAlerts` + `useDismissAlert`
- `useTriggerRevOpsSnapshot` (admin on-demand)

### 4. UI

**`/revops`** — hub com 3 tabs:
- **Funil**: `RevenueFunnelChart` (Visitor→Lead→MQL→SQL→Opp→Customer) com taxas e drop-off destacado em vermelho quando abaixo do benchmark
- **KPIs**: `KPIComparisonGrid` (Pipeline Coverage, Win Rate, Cycle Time, MQL→SQL %, SQL→Won %) com setas trend vs período anterior
- **Benchmarks**: `BenchmarkConfigForm` para configurar metas por métrica

**Componentes** em `src/components/revops/`:
- `RevenueFunnelChart` (recharts FunnelChart)
- `KPIComparisonGrid` (grid de StatCards com delta %)
- `BenchmarkConfigForm`
- `RevOpsAlertList` (cards dismissíveis no topo do hub)
- `PeriodSelector` (7d/30d/90d/QTD)

### 5. Navegação & Cron
- `App.tsx`: rota `/revops` (auth, lazy)
- `AppSidebar`: item "RevOps" (ícone `Activity`) abaixo de Forecasting
- `pg_cron` via `supabase--insert`: job `revops-snapshot-builder` diário 04:00 UTC

### 6. Memória
- Criar `mem://features/revops-dashboard`
- Atualizar `mem://index.md` adicionando entrada

### Não fazer
- Não refatorar dashboards existentes (Pipeline/Forecasting/Analytics) — RevOps lê deles
- Não criar produtos/propostas
- Sem integração ERP/contabilidade externa
- Sem export PDF nesta entrega
