
Marketing Automation Suite ficou 90% pronto. Faltam 3 itens críticos para usar de fato + próximo gap real.

## Plano: Finalizar Marketing Suite + Próxima Melhoria

### Parte A — Fechar Marketing Automation (entrega real)
1. **Rotas em `App.tsx`**: registrar `/marketing`, `/marketing/forms/:id`, `/marketing/lead-magnets/:id` (auth) e `/f/:slug`, `/lm/:slug` (públicas, fora do AuthGuard)
2. **AppSidebar**: novo item "Marketing" (ícone `Megaphone`) abaixo de "Nurturing"
3. **Cron schedules** via migration `pg_cron`:
   - `nurturing-runner` a cada 5 min
   - `mql-evaluator` diariamente às 03:00 UTC
4. **Integração contato**: nova aba "Touchpoints" em `ContatoDetalhe` com timeline simples + badge MQL/SQL no header

### Parte B — Próximo gap: **Revenue Operations Dashboard (RevOps)**
Hoje há dashboards isolados (Pipeline, Forecasting, Analytics, Lead Scoring) mas sem visão **unificada de eficiência da máquina de receita**. RevOps responde: onde está o gargalo do funil ponta-a-ponta?

**Schema:**
- `revops_snapshots` — id, user_id, period (date), funnel_stage, count, conversion_rate, avg_velocity_days, captured_at
- `revops_benchmarks` — user_id, metric_key, target_value, warning_threshold, critical_threshold

**Edge Function:**
- `revops-snapshot-builder` (cron diário): consolida MQL → SQL → Opportunity → Deal Won, calcula conversion rates, velocity médio por estágio, CAC payback proxy, pipeline coverage ratio

**UI `/revops`:**
- Funnel chart ponta-a-ponta (Visitor → Lead → MQL → SQL → Opp → Customer) com taxas de conversão e drop-off destacado
- KPIs: Pipeline Coverage (3x meta?), Win Rate, Cycle Time médio, MQL→SQL conversion, SQL→Won conversion
- Comparativo período atual vs anterior com setas trend
- Alertas automáticos: "Conversão MQL→SQL caiu 15% vs mês anterior"
- Tab "Benchmarks" para configurar metas por métrica

**Hooks:** `useRevOpsSnapshots`, `useRevOpsBenchmarks`, `useRevOpsAlerts`

**Componentes:** `RevenueFunnelChart`, `KPIComparisonGrid`, `BenchmarkConfigForm`, `RevOpsAlertList`

**Sidebar:** "RevOps" (ícone `Activity`) abaixo de Forecasting

**Memória:** `mem://features/revops-dashboard` + atualizar `marketing-automation-suite` marcando finalização

### Não fazer
- Não criar produtos/propostas
- Sem refatorar dashboards existentes — RevOps é camada agregadora que lê deles
- Sem integração externa de contabilidade/ERP
