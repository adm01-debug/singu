
RevOps acabou. Próximo gap real do CRM enterprise = **Customer Success / Health Score Module**. Hoje há lead scoring, churn risk e RevOps mas falta acompanhamento estruturado pós-venda: health score por cliente, NPS/CSAT tracking, QBRs, expansion playbooks e renewal pipeline. Sem isso o CRM "termina no Won" e perde o ciclo expansion/upsell/retention.

## Plano: Customer Success Suite

### 1. Schema (migration)
- `cs_accounts` — id, user_id, contact_id (FK), company_id, csm_owner_id, tier ('strategic'|'enterprise'|'mid'|'smb'), arr numeric, contract_start, renewal_date, lifecycle_stage ('onboarding'|'adopting'|'mature'|'at_risk'|'churned'), health_score int (0-100), updated_at
- `cs_health_signals` — id, account_id, signal_type ('usage'|'support'|'engagement'|'sentiment'|'payment'|'nps'), score numeric, weight numeric, captured_at, metadata jsonb
- `cs_nps_responses` — id, account_id, contact_id, score int (0-10), category ('promoter'|'passive'|'detractor'), comment, surveyed_at
- `cs_qbrs` — id, account_id, scheduled_at, completed_at, status, agenda jsonb, outcomes jsonb, next_steps jsonb, attendees jsonb
- `cs_renewals` — id, account_id, renewal_date, status ('upcoming'|'in_negotiation'|'renewed'|'churned'|'downgraded'), forecasted_arr, actual_arr, risk_level, notes
- RLS por user_id; índices em (user_id, renewal_date), (account_id, signal_type)
- RPC `compute_account_health(_account_id)` agrega signals ponderados → health_score
- RPC `cs_renewal_pipeline(_user_id, _days_ahead)` retorna renewals dos próximos N dias

### 2. Edge Function
- `cs-health-recalc` (cron diário 05:00 UTC): para cada account, agrega health_signals dos últimos 90d com decay temporal, atualiza health_score, gera alerta se queda >20pts ou score <40

### 3. Hooks
- `useCSAccounts`, `useCSAccount(id)`, `useUpsertCSAccount`
- `useHealthSignals(accountId)`, `useRecordSignal`
- `useNPS(accountId)`, `useSubmitNPS`
- `useQBRs(accountId)`, `useUpsertQBR`
- `useRenewals(daysAhead)`, `useUpdateRenewal`

### 4. UI

**`/customer-success`** — hub com 4 tabs:
- **Portfolio**: grid de accounts com health score colorido (verde/amarelo/vermelho), tier badge, renewal countdown, CSM owner
- **Renewals**: pipeline de renovações próximas (30/60/90d) ordenado por risco
- **NPS**: score médio, distribuição promoters/passives/detractors, comments recentes
- **QBRs**: calendário de QBRs agendados + concluídos com outcomes

**`/customer-success/account/:id`** — detalhe do account:
- Header: health score gauge, tier, ARR, renewal date countdown
- Tab Health: timeline de signals + breakdown por categoria
- Tab QBRs: histórico + agendar novo
- Tab NPS: histórico de respostas
- Tab Expansion: oportunidades de upsell/cross-sell

**Componentes** em `src/components/customer-success/`:
- `HealthScoreGauge`, `AccountPortfolioCard`, `RenewalPipelineList`
- `NPSDistributionChart`, `NPSResponseDialog`, `QBRScheduler`, `QBROutcomesEditor`
- `HealthSignalTimeline`, `ExpansionOpportunityList`

### 5. Navegação & Cron
- `App.tsx`: rotas `/customer-success` e `/customer-success/account/:id` (auth, lazy)
- `AppSidebar`: item "Customer Success" (ícone `Heart`) abaixo de RevOps
- `pg_cron` via `supabase--insert`: job `cs-health-recalc` diário 05:00 UTC

### 6. Memória
- Criar `mem://features/customer-success-suite`

### Não fazer
- Não criar produtos/propostas
- Sem integração com Gainsight/ChurnZero/Totango (externos)
- Sem refatorar churn-risk-detection — CS Suite consome dele como signal
- Sem ticketing — Help Desk já existe e será referenciado, não duplicado
